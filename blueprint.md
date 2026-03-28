# **sorigrim 1.0 — Project Blueprint**

## **1. Project Overview**
**sorigrim**은 "Prompt와 Perception 사이의 경계를 정제하는 인공지능 생성 시네마틱 비전"을 컨셉으로 한 프리미엄 포트폴리오 플랫폼입니다. 고도의 시각적 연출과 최신 웹 표준 기술(Modern CSS, Web Components)을 결합하여, 단순한 갤러리를 넘어선 하나의 '디지털 경험'을 제공하는 것을 목표로 합니다.

## **2. Architecture & Tech Stack**
*   **Frontend:** Framework-less HTML5, Modern CSS (Cascade Layers, Container Queries, oklch), Vanilla JS (ES Modules).
*   **Web Components:** `<sg-footer>` 등 재사용 가능한 UI 요소를 캡슐화하여 사용.
*   **Backend:** Cloudflare Pages Functions (API).
*   **Database:** Cloudflare D1 (SQLite) - 포트폴리오 메타데이터 저장.
*   **Storage:** Cloudflare R2 - 미디어(이미지, 비디오) 자산 호스팅.
*   **Styling:** 시네마틱한 분위기를 위해 Grain 텍스처, 깊이 있는 그림자, 유려한 애니메이션(`reveal-up`) 적용.

## **3. Implementation Details (Current Status)**
*   **Main Page (`/`):** 히어로 섹션 비디오를 관리자에서 직접 업로드하고 동적으로 재생하는 기능 구현 완료.
*   **Archive (`/portfolio/`):** 전체 작품 목록 조회 및 카테고리 필터링 지원.
*   **Admin (`/admin/`):** 
    - **에디터 고도화:** 문서 편집기 수준의 Rich Text Editor 구현. 본문 내 직접 이미지/영상 업로드 및 삽입 지원.
    - **미디어 관리:** 랜딩 페이지 히어로 비디오 및 SNS 아이콘 업로드 기능 추가.
*   **Unified Footer:** 모든 페이지 하단에 SNS 링크(아이콘 포함)와 규정 사항(Privacy, Terms)을 포함한 "Connect" 섹션 통합 완료.

## **4. Completed Tasks (March 2026)**

### **Phase 4: Media-Centric CMS & Unified Footer Integration**
*   **Result:** `assets.js`에 POST 메서드를 추가하여 R2 버킷으로의 직접 업로드 환경 구축.
*   **Result:** `editor.html`을 고도화하여 `contenteditable` 기반의 리치 에디터와 미디어 삽입 버튼 구현.
*   **Result:** `sg-footer` 웹 컴포넌트를 업그레이드하여 SNS 설정과 연동된 통합 하단바 구현.
*   **Result:** 관리자 대시보드에서 사이트 전역 설정(랜딩 비디오 등) 관리 섹션 추가.

### **Phase 5: Cinematic UX Refinement & SEO Optimization**
*   **Result:** All public pages now include comprehensive SEO and OpenGraph meta tags for better discoverability and social sharing.
*   **Result:** `portfolio/detail.html` features intuitive "Next" and "Previous" project navigation, supported by a backend API update.
*   **Result:** Admin `dashboard.html` UI has been refined to match the cinematic aesthetic, with redundant sections removed and better styling.
*   **Result:** A global cinematic page transition (fade-in/out) has been implemented to ensure a high-end, seamless user experience.
*   **Result:** The Cloudflare Pages Functions API (`portfolio.js`) was enhanced to return adjacent navigation metadata.

## **6. Verification & Testing**
1.  Check SEO meta tags in the document head.
2.  Verify "Next/Prev" links in the portfolio detail page correctly fetch the adjacent items.
3.  Ensure the admin dashboard is clean and consistent.
4.  Perform a final build and deployment check.
