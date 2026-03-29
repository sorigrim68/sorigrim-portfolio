# **sorigrim 2.0 — Technical Professional Evolution**

## **1. Project Overview**
**sorigrim**은 기존의 시네마틱한 감성을 유지하되, **DMS Solution**의 전문적이고 정돈된 디자인 언어를 결합하여 "기술과 예술이 결합된 전문 포트폴리오 플랫폼"으로 진화했습니다.

## **2. Design Identity**
*   **Concept:** Clean, Technical, Professional, Reliable.
*   **Colors:** Base(#FFFFFF), Point(#0055FF), Deep Black(#111111).
*   **Hero System:** 
    - 게시글 썸네일 로직을 활용한 100% 가시성 보장.
    - Ken Burns 확대 애니메이션 적용.
    - 스크롤 연동 투명 내비게이션 바.

## **3. Implementation Details**
*   **Hero Integrated Management:** 별도의 관리 메뉴 대신, 게시글 에디터 내 `is_hero` 옵션을 통해 메인 배경 이미지/영상을 통합 관리합니다.
*   **Database Migration:** `is_hero` 컬럼 자동 추가 및 단일 히어로 포스트 유지 로직(Trigger-like API) 구현.
*   **Asset Explorer:** R2 스토리지의 모든 파일을 직접 관리(삭제)할 수 있는 대시보드 기능 추가.
*   **Full Localization:** 사이트의 모든 UI 및 법적 고지 페이지를 한국어로 완벽 현지화.

### **Phase 8: Admin Dashboard Optimization & Automated Deployment**
*   **Result:** 스토리지 탐색기(Asset Explorer)를 기본 '접힘' 상태로 변경하고 펼치기 기능을 추가하여 관리자 대시보드 가시성 최적화.
*   **Result:** Git Push 연동을 통한 실시간 클라우드플레어 페이지 배포(Automated Deployment) 워크플로우 확립.

### **Phase 9: Landing Page Expansion & Advanced Analytics**
*   **Result:** 랜딩 페이지 추천 작품 노출 수를 기존 9개에서 15개로 확대하여 콘텐츠 가독성 및 노출 기회 증대.
*   **Result:** 게시글 에디터에 '추천 작품 등록' 체크박스를 추가하여 수동으로 메인 페이지 노출 제어 기능 구현.
*   **Result:** 방문자 통계 분석 시스템(`sg_stats`) 구축: 누적 페이지 뷰, 일일 유니크 방문자, 유입 경로(Referrer) 분석, 인기 페이지 순위 실시간 대시보드 제공.

### **Phase 10: Board-Specific Content Management**
*   **Result:** 게시글 관리 시스템을 '전체 목록' 방식에서 '게시판 선택' 방식으로 전면 개편하여 운영 효율성 극대화.
*   **Result:** 게시판(카테고리) 설정과 게시글 관리 UI 간의 실시간 연동 로직 구현: 게시판 추가/삭제 시 관리 메뉴 즉시 반영.
*   **Result:** 특정 게시판 선택 시에만 해당 카테고리의 글을 로드하도록 최적화하여 관리자 페이지 로딩 성능 개선.

### **Phase 11: Multi-Board Landing Page Layout**
*   **Result:** 랜딩 페이지의 'Featured Artworks' 섹션을 게시판별 독립 섹션 구조로 개편.
*   **Result:** 게시판별 4개씩 노출 로직 구현: '추천글'을 우선 배치하되, 추천글이 4개 미만인 경우 해당 게시판의 '최신글'로 자동 보충.
*   **Result:** 글이 하나도 없는 게시판은 메인 페이지에서 자동으로 제외하여 깔끔한 레이아웃 유지.
*   **Result:** 각 섹션 우측 하단에 'VIEW ALL' 링크를 추가하여 해당 게시판 전체보기로 자연스러운 이동 유도.

## **5. Verification & Testing**
1.  게시글 수정 시 `is_hero` 체크를 통해 메인 배경이 즉시 변경되는지 확인.
2.  스크롤 시 내비게이션 바의 배경색 전환 확인.
3.  스토리지 익스플로러를 통한 파일 삭제 기능 검증.
4.  게시판 선택 시 해당 게시판의 글만 정확히 필터링되는지 확인.
5.  모든 기기(모바일/웹)에서 레이아웃 정렬 상태 검토.
