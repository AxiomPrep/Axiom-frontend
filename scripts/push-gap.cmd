@echo off
cd /d "%~dp0\.."
git add src/lib/admin.ts src/lib/faculty-catalog.ts src/app/admin-api/contents/route.ts src/app/api/teachers/[id]/modules/route.ts src/app/api/teachers/[id]/route.ts src/app/api/teachers/[id]/chapters/[chapterId]/route.ts
git -c user.name="ayush68824" -c user.email="ayush.kumar2021@vitbhopal.ac.in" commit -m "Attach live admin lectures to the seeded teacher page students actually open."
if errorlevel 1 exit /b 1
git push origin main
exit /b %ERRORLEVEL%
