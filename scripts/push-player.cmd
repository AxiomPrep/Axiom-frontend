@echo off
cd /d "%~dp0\.."
git add "src/app/watch/[contentId]/page.tsx" src/lib/admin-destinations.ts
git -c user.name="ayush68824" -c user.email="ayush.kumar2021@vitbhopal.ac.in" commit -m "Make YouTube lecture skip and speed controls drive the embed player."
if errorlevel 1 exit /b 1
git push origin main
exit /b %ERRORLEVEL%
