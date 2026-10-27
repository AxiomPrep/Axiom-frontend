@echo off
cd /d "%~dp0\.."
git add src/lib/extracted-questions.ts src/components/PdfQuestionFigure.tsx
git -c user.name="ayush68824" -c user.email="ayush.kumar2021@vitbhopal.ac.in" commit -m "Add missing question modules so the Netlify production build can compile."
if errorlevel 1 exit /b 1
git push origin main
exit /b %ERRORLEVEL%
