@echo off
curl -s "http://localhost:3000/catalog/teachers"
echo.
echo === LIVE ADMIN ===
curl -s -H "x-admin-email: admin@axiomprep.com" "https://axiom-backend-dwlc.onrender.com/api/admin/contents"
