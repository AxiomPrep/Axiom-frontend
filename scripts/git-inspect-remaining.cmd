@echo off
cd /d "%~dp0.."
echo === REAL CONTENT DIFF ===
git diff --ignore-cr-at-eol
echo === AUTH PATHS ===
git diff -- src/lib/auth-paths.ts src/middleware.ts
echo === CRLF ONLY? ===
git diff --ignore-space-at-eol --numstat
echo === LOG ===
git log -3 --oneline
