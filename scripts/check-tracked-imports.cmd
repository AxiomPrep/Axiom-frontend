@echo off
cd /d "%~dp0\.."
echo === mockCurriculum tracked? ===
git ls-files src/data/mockCurriculum.ts src/data/mockCurriculum.tsx
echo === untracked src again ===
git ls-files --others --exclude-standard src
echo === types ===
git ls-files src/types/pdf-min.d.ts
