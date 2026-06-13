/**
 * 기존 data.json 의 태그만 재수집 (썸네일/프롬프트는 유지)
 * 실행: node scripts/fix-tags.mjs
 */
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
const OUT   = join(ROOT, 'prompts', 'data.json');

const DELAY_MS    = 300;
const CONCURRENCY = 8;

const TAG_LABELS = {
  action:'Action', romance:'Romance', comedy:'Comedy', horror:'Horror',
  'sci-fi':'Sci-Fi', scifi:'Sci-Fi', fantasy:'Fantasy', drama:'Drama',
  documentary:'Documentary', animation:'Animation', 'clay-animation':'Clay Animation',
  anime:'Anime', realistic:'Realistic', cinematic:'Cinematic', retro:'Retro',
  surreal:'Surreal', minimal:'Minimal', nature:'Nature', food:'Food',
  fashion:'Fashion', architecture:'Architecture', portrait:'Portrait',
  animal:'Animal', product:'Product', abstract:'Abstract', urban:'Urban',
  'close-up':'Close Up', aerial:'Aerial', tracking:'Tracking',
  'slow-motion':'Slow Motion', timelapse:'Timelapse', pan:'Pan',
  zoom:'Zoom', 'first-person':'First Person'
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchTags(id) {
  try {
    const res = await fetch(`https://www.scenic.sh/prompt/${id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return [];
    const html = await res.text();
    // 패턴: href="/?tag=action" or href="/?tag=sci-fi"
    const matches = [...html.matchAll(/href="\/?(?:\?tag=|tag\/)([a-z\-]+)"/gi)];
    const tags = matches
      .map(m => TAG_LABELS[m[1].toLowerCase()] || m[1])
      .filter((v, i, a) => a.indexOf(v) === i); // unique
    return tags;
  } catch { return []; }
}

async function main() {
  console.log('\n🏷️  태그 재수집 시작\n');
  const data = JSON.parse(readFileSync(OUT, 'utf8'));
  const needFix = data.filter(p => !p.tags?.length || (p.tags.length === 1 && p.tags[0] === 'Cinematic'));
  console.log(`수정 대상: ${needFix.length} / ${data.length}`);

  const idMap = {};
  data.forEach(p => idMap[p.id] = p);

  let done = 0;
  for (let i = 0; i < needFix.length; i += CONCURRENCY) {
    const batch = needFix.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(p => fetchTags(p.id)));
    results.forEach((r, j) => {
      const p = batch[j];
      if (r.status === 'fulfilled' && r.value.length) {
        idMap[p.id].tags = r.value;
      }
    });
    done += batch.length;
    process.stdout.write(`\r   진행: ${done} / ${needFix.length}`);
    await sleep(DELAY_MS);
  }

  // 저장
  const updated = Object.values(idMap);
  writeFileSync(OUT, JSON.stringify(updated, null, 2), 'utf8');

  // 통계
  const tagCounts = {};
  updated.forEach(p => p.tags?.forEach(t => { tagCounts[t] = (tagCounts[t]||0)+1; }));
  const sorted = Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]);

  console.log(`\n\n✅ 완료: ${updated.length}개`);
  console.log('\n태그 분포:');
  sorted.forEach(([t,n]) => console.log(`  ${t.padEnd(20)} ${n}`));
  console.log('\n💾 prompts/data.json 업데이트 완료');
}

main().catch(console.error);
