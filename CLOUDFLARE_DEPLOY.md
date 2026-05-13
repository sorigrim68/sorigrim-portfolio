# Cloudflare Pages + D1 배포

이 앱은 두 방식으로 동작합니다.

- `?key=`가 없는 경우: 브라우저 로컬 저장소 사용
- `?key=긴공유키`가 있는 경우: Cloudflare Pages Function과 D1에 공유 저장

단, 공개 배포에서 링크가 있는 사용자만 사용하게 하려면 `VITE_REQUIRE_SHARE_KEY=true`로 빌드합니다. 이 경우 `?key=`가 없는 주소는 업무 보드 대신 접근 안내 화면만 표시합니다.

고정 PIN 보호까지 사용하려면 `VITE_REQUIRE_PIN=true`와 `VITE_BOARD_PIN`을 함께 지정합니다. 현재 배포 기본 PIN은 `2580`입니다.

## 1. D1 스키마 적용

Cloudflare D1 데이터베이스가 이미 있다면 아래 SQL을 적용합니다.

```bash
npx wrangler d1 execute YOUR_D1_DATABASE_NAME --remote --file=./schema.sql
```

## 2. Pages 프로젝트에 D1 binding 추가

Cloudflare Dashboard에서:

1. Workers & Pages
2. `sorigrim-portfolio` Pages 프로젝트 선택
3. Settings
4. Bindings
5. Add binding
6. D1 database
7. Variable name: `DB`
8. D1 database: 사용할 D1 선택
9. 저장 후 재배포

## 3. 기존 portfolio 하위 경로로 빌드

`https://sorigrim.com/xconda-board/`에 올릴 경우:

```bash
$env:VITE_BASE_PATH='/xconda-board/'
$env:VITE_REQUIRE_SHARE_KEY='true'
$env:VITE_REQUIRE_PIN='true'
$env:VITE_BOARD_PIN='2580'
npm run build
```

생성된 `dist` 내용을 `sorigrim-portfolio` 저장소의 `xconda-board` 폴더에 넣습니다.

## 4. Pages Function 추가

`functions/api/board.ts`를 `sorigrim-portfolio/functions/api/board.ts`로 복사합니다.

## 5. 접속 링크

공유 보드 URL 예시:

```txt
https://sorigrim.com/xconda-board/?key=xconda-team-2026-random-long-key
```

`key`가 같은 팀원은 같은 D1 보드 데이터를 공유합니다.

키는 12~128자의 영문, 숫자, `_`, `-`만 사용할 수 있습니다.

Cloudflare Pages 환경변수 `BOARD_PIN`을 설정하면 API에서도 같은 PIN을 기준으로 공유 보드 데이터를 보호합니다. 환경변수를 설정하지 않으면 기본값 `2580`을 사용합니다.

## 주의

이 방식은 비밀 링크 방식입니다. 링크가 외부로 공유되면 외부 사용자도 접근할 수 있습니다. 더 강한 보호가 필요하면 Cloudflare Access를 추가하세요.
