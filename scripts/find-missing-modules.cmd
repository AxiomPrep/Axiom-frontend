@echo off
cd /d "%~dp0\.."
echo === UNTRACKED SRC ===
git ls-files --others --exclude-standard src
echo === STATUS ===
git status --short src/lib/extracted-questions.ts src/app/catalog/questions/route.ts
