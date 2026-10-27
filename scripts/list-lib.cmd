@echo off
cd /d "%~dp0\.."
echo === TRACKED LIB ===
git ls-files src/lib
echo === TRACKED CATALOG ===
git ls-files src/app/catalog
echo === LOCAL LIB ===
dir /b src\lib
echo === MISSING IMPORTS CHECK ===
git ls-files src/lib/desk-catalog.ts src/lib/desk-contents.ts src/lib/live-api.ts src/lib/extracted-questions.ts src/lib/admin-destinations.ts src/lib/content-ingest.ts
