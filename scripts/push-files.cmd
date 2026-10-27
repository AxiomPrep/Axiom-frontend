@echo off
cd /d "%~dp0\.."
git add src/lib/admin.ts src/lib/admin-destinations.ts src/app/admin/page.tsx src/app/admin-api/contents/route.ts src/data/admin-teachers.ts "src/app/api/contents/[id]/route.ts"
git -c user.name="ayush68824" -c user.email="ayush.kumar2021@vitbhopal.ac.in" commit -m "Send admin PDF and Excel files to Render storage instead of blocking uploads."
if errorlevel 1 exit /b 1
git push origin main
exit /b %ERRORLEVEL%
