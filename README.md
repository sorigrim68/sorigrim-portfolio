# xconda 업무 보드

단체 업무를 등록하고, 담당자와 상태별로 빠르게 관리하는 React 기반 업무 보드입니다.

## 주요 기능

- 작업명, 담당자, 프로젝트, 마감일, 우선순위, 메모 등록
- 시작일과 마감일 기반 작업 기간 관리
- 상태별 보드: 할 일, 진행 중, 검토, 완료
- 작업 상세 패널에서 목표, 메모, 담당자, 상태, 날짜 수정
- 세부 체크리스트와 진행 로그 기록
- 작업별 첨부 링크 추가와 삭제
- 상태 변경 시 진행 로그 자동 기록
- 최근 활동 목록에서 작업 변경 흐름 확인
- 팀원 추가, 삭제, 담당자 필터
- 작업, 프로젝트, 담당자 검색
- 프로젝트, 우선순위, 기간 기준 상세 필터
- 지연, 긴급, 검토 대기, 무진행 병목 요약
- 우선 확인 작업 목록
- 프로젝트별 완료율, 고우선순위, 지연 현황
- 담당자별 업무 부하 점수와 7일 내 마감 작업 요약
- 현재 필터 결과 CSV 내보내기
- Cloudflare Pages Function + D1 기반 공유 보드 모드
- `?key=` 비밀 링크 기반 팀 공유
- 배포 빌드에서 `?key=` 없는 접속 차단 옵션
- 고정 PIN 입력 후 보드 진입
- 개인별 열린 작업, 마감 임박, 완료율 확인
- 담당자별 작업을 날짜 축에 배치하는 선형 그래프 달력
- 마감일 기준 카드형 달력 타임라인
- 열린 작업, 마감 임박, 완료율, 전체 작업 지표
- 브라우저 로컬 저장소 자동 저장
- 데스크톱과 모바일 반응형 레이아웃

## 실행

```bash
npm install
npm run dev
```

기본 개발 서버 주소는 Vite가 출력하는 로컬 URL입니다.

## 검증

```bash
npm run lint
npm run build
```

## Cloudflare 공유 배포

Cloudflare Pages와 D1로 팀 공유 모드를 배포하려면 [CLOUDFLARE_DEPLOY.md](./CLOUDFLARE_DEPLOY.md)를 참고하세요.

`sorigrim.com/xconda-board/`에 링크가 있는 사용자만 접속하게 배포하려면 아래처럼 빌드합니다.

```bash
$env:VITE_BASE_PATH='/xconda-board/'
$env:VITE_REQUIRE_SHARE_KEY='true'
$env:VITE_REQUIRE_PIN='true'
$env:VITE_BOARD_PIN='2580'
npm run build
```

공유 링크는 `https://sorigrim.com/xconda-board/?key=팀전용긴키` 형식입니다.
현재 기본 PIN은 `2580`입니다.
