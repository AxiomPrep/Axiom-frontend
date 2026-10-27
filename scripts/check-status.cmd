@echo off
cd /d "%~dp0\.."
git status --short src/lib/admin.ts src/lib/admin-destinations.ts src/app/admin/page.tsx src/app/admin-api/contents/route.ts src/data/admin-teachers.ts
git diff --stat src/data/admin-teachers.ts
