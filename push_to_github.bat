@echo off
title Push BidFly to GitHub Repository
color 0b
echo ========================================================
echo   BidFly Enterprise Suite - GitHub Repository Push
echo ========================================================
echo.
echo Target Repository: https://github.com/tamaladvanceforging-boop/bid-fly
echo Author: Tamal Roy Chowdhury
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not found in system PATH.
    echo.
    echo Please install Git for Windows from:
    echo https://git-scm.com/download/win
    echo.
    echo After installing Git, double-click this file again!
    echo ========================================================
    pause
    exit /b 1
)

echo [1/5] Initializing Git repository...
if not exist .git (
    git init
    git branch -M main
)

echo [2/5] Configuring Git remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/tamaladvanceforging-boop/bid-fly.git

echo [3/5] Staging project source files...
git add .

echo [4/5] Creating commit...
git commit -m "feat: complete BidFly enterprise suite with datasheet automation and UI/UX by Tamal Roy Chowdhury"

echo [5/5] Pushing to GitHub (https://github.com/tamaladvanceforging-boop/bid-fly)...
echo.
echo NOTE: If prompted, please sign in with your GitHub account in the pop-up browser window.
echo.
git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   [SUCCESS] BidFly project pushed to GitHub successfully!
    echo   Check your repo at: https://github.com/tamaladvanceforging-boop/bid-fly
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   [FAILED] Push failed. Please verify your GitHub login or permissions.
    echo ========================================================
)

echo.
pause
