@echo off
setlocal

echo =========================================
echo       CMS_V2 Git Auto-Upload Script      
echo =========================================
echo.

:: Prompt for commit / checkpoint name
set /p COMMIT_MSG="Enter commit / checkpoint name: "

:: If user presses enter without typing a message, set default
if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=Checkpoint update - %date% %time%
)

echo.
echo [1/3] Staging changes (git add .)...
git add .

echo.
echo [2/3] Creating commit: "%COMMIT_MSG%"...
git commit -m "%COMMIT_MSG%"

echo.
echo [3/3] Pushing to GitHub (git push origin main)...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo =========================================
    echo   Successfully uploaded to GitHub!
    echo =========================================
) else (
    echo =========================================
    echo   Failed to push. Please check errors above.
    echo =========================================
)

echo.
pause
