@echo off
chcp 65001 >nul
title SORIGRIM — Prompt Gallery 업데이트

echo.
echo ================================================
echo  SORIGRIM Prompt Gallery 데이터 업데이트
echo ================================================
echo.

cd /d "D:\Claude Code\sorigrim-portfolio"

echo [1/4] scenic.sh 새 프롬프트 수집 중...
node scripts/scrape-scenic.mjs
if %errorlevel% neq 0 (
    echo.
    echo [오류] 스크래퍼 실행 실패. Node.js 설치 여부를 확인하세요.
    pause
    exit /b 1
)

echo.
echo [2/4] 태그 보완 중...
node scripts/fix-tags.mjs
if %errorlevel% neq 0 (
    echo.
    echo [오류] 태그 수집 실패.
    pause
    exit /b 1
)

echo.
echo [3/4] Git 커밋 중...
git add prompts/data.json
git commit -m "data: update prompt gallery"
if %errorlevel% neq 0 (
    echo [알림] 변경된 데이터가 없습니다.
)

echo.
echo [4/4] GitHub 배포 중...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo [오류] Push 실패. 인터넷 연결 또는 GitHub 인증을 확인하세요.
    pause
    exit /b 1
)

echo.
echo ================================================
echo  완료! sorigrim.com/prompts/ 에 1~2분 내 반영됩니다.
echo ================================================
echo.
pause
