@echo off
cd /d "%~dp0.."
git add src/lib/auth-paths.ts src/middleware.ts
git add -u
git add scripts
git status -sb
echo ---STAGED---
git diff --cached --stat
git commit -m "Allow Google site verification files through auth middleware."
if errorlevel 1 exit /b 1
git push origin HEAD
git status -sb
