/**
 * scenic.sh 전체 프롬프트 수집기
 *
 * 실행: node scripts/scrape-scenic.mjs
 *
 * - sitemap.xml 에서 모든 프롬프트 URL 파싱
 * - 각 페이지에서 prompt / twitterUrl / thumbnail / tags 추출
 * - prompts/data.json 으로 저장
 */

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');
const OUT  = join(ROOT, 'prompts', 'data.json');
const CACHE_FILE = join(ROOT, 'scripts', '.scrape-cache.json');

const SITEMAP_URL = 'https://www.scenic.sh/sitemap.xml';
const SUPABASE    = 'https://wjvqayfliyzimffhxdld.supabase.co/storage/v1/object/public/thumbnails/references/';
const DELAY_MS    = 400;   // 서버 부담 최소화
const CONCURRENCY = 5;     // 동시 요청 수

// ── 유틸 ──────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function tweetIdFromUrl(url) {
  const m = url?.match(/\/status\/(\d+)/);
  return m ? m[1] : null;
}

function thumbFromTweetId(tid) {
  return tid ? `${SUPABASE}${tid}-0.jpg` : null;
}

// 간단한 HTML 파서 (cheerio 없이)
function extract(html, pattern) {
  const m = html.match(pattern);
  return m ? m[1].trim() : null;
}

// ── 사이트맵 파싱 ──────────────────────────────────────
async function fetchSitemap() {
  console.log('📄 사이트맵 로딩...');
  const res = await fetch(SITEMAP_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>(https:\/\/www\.scenic\.sh\/prompt\/[^<]+)<\/loc>/g)]
    .map(m => m[1]);
  console.log(`   → ${urls.length}개 프롬프트 URL 발견`);
  return urls;
}

// ── 개별 페이지 파싱 ──────────────────────────────────
async function scrapePage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(12000)
    });

    if (!res.ok) return null;
    const html = await res.text();

    // ID
    const id = url.split('/prompt/')[1];

    // 트위터 URL — href 에서 x.com 또는 twitter.com 링크 추출
    const twitterMatch = html.match(/href="(https?:\/\/(?:x\.com|twitter\.com)\/[^/]+\/status\/\d+)"/);
    const twitterUrl = twitterMatch ? twitterMatch[1].replace('twitter.com', 'x.com') : null;
    const tid = tweetIdFromUrl(twitterUrl);

    // 썸네일 — supabase URL 추출 (references/ 또는 thumbnails/)
    const thumbMatch = html.match(/https:\/\/wjvqayfliyzimffhxdld\.supabase\.co\/storage\/v1\/object\/public\/thumbnails\/[^"'\s]+/);
    const thumbnail = thumbMatch ? thumbMatch[0] : thumbFromTweetId(tid);

    // 태그 — 클래스 기반 추출 시도
    const tagMatches = [...html.matchAll(/class="[^"]*tag[^"]*"[^>]*>([^<]{2,30})<\/[a-z]+>/gi)];
    const tags = tagMatches
      .map(m => m[1].trim())
      .filter(t => t.length > 1 && t.length < 30 && !t.includes('<') && /^[a-zA-Z\s\-\/]+$/.test(t))
      .slice(0, 4);

    // 프롬프트 텍스트 — <p> 또는 <div> 에서 가장 긴 텍스트 블록
    const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                         .replace(/<style[\s\S]*?<\/style>/gi, '')
                         .replace(/<[^>]+>/g, ' ')
                         .replace(/\s{2,}/g, ' ');

    // 주요 단락 추출 (100자 이상 연속 텍스트)
    const paragraphs = stripped.split(/\.\s+|\n/)
      .map(s => s.trim())
      .filter(s => s.length > 80);

    // 가장 긴 단락들을 프롬프트로
    paragraphs.sort((a, b) => b.length - a.length);
    const prompt = paragraphs.slice(0, 3).join('\n').substring(0, 2000).trim();

    if (!prompt && !twitterUrl) return null;

    return { id, prompt: prompt || '', twitterUrl, thumbnail, tags };

  } catch (e) {
    return null;
  }
}

// ── 병렬 배치 실행 ──────────────────────────────────────
async function runBatch(urls, startIdx, cache) {
  const results = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(batch.map(u => scrapePage(u)));
    settled.forEach((s, j) => {
      const url = batch[j];
      const id  = url.split('/prompt/')[1];
      if (s.status === 'fulfilled' && s.value) {
        results.push(s.value);
        cache[id] = s.value;
      } else {
        cache[id] = null; // 실패 기록 (재시도 안 함)
      }
    });
    const done = startIdx + i + Math.min(CONCURRENCY, batch.length);
    process.stdout.write(`\r   진행: ${done} / ${startIdx + urls.length}`);
    await sleep(DELAY_MS);
  }
  return results;
}

// ── 메인 ──────────────────────────────────────────────
async function main() {
  console.log('\n🎬 scenic.sh 스크래퍼 시작\n');

  // 캐시 로드 (이전 실행 결과 재사용)
  let cache = {};
  if (existsSync(CACHE_FILE)) {
    try { cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8')); } catch {}
    console.log(`💾 캐시 로드: ${Object.keys(cache).length}개`);
  }

  // 기존 data.json 로드
  let existing = [];
  if (existsSync(OUT)) {
    try { existing = JSON.parse(readFileSync(OUT, 'utf8')); } catch {}
  }
  const existingIds = new Set(existing.map(p => p.id));

  // 사이트맵
  const allUrls = await fetchSitemap();

  // 아직 수집 안 된 URL만 필터
  const newUrls = allUrls.filter(u => {
    const id = u.split('/prompt/')[1];
    return !cache.hasOwnProperty(id);
  });

  console.log(`\n🔍 수집 대상: ${newUrls.length}개 (캐시 제외)\n`);

  let newResults = [];
  if (newUrls.length > 0) {
    newResults = await runBatch(newUrls, 0, cache);
    console.log(`\n\n✅ 새로 수집: ${newResults.length}개`);
    // 캐시 저장
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  }

  // 전체 데이터 합산 (캐시에서 유효한 항목 모두)
  const all = Object.values(cache).filter(Boolean);

  // tags 없는 항목 보완
  const cleaned = all.map(p => ({
    ...p,
    tags: p.tags?.length ? p.tags : ['Cinematic'],
    thumbnail: p.thumbnail || null
  }));

  // 저장
  writeFileSync(OUT, JSON.stringify(cleaned, null, 2), 'utf8');
  console.log(`\n💾 저장 완료: prompts/data.json (${cleaned.length}개)`);
  console.log('\n다음 단계:');
  console.log('  git add prompts/data.json && git commit -m "data: update prompt gallery" && git push\n');
}

main().catch(console.error);
