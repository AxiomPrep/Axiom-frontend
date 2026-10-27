@echo off
cd /d "%~dp0.."
echo === FRONTEND STATUS ===
git status -sb
echo === FRONTEND DIFF STAT ===
git diff --stat
echo === FRONTEND UNTRACKED ===
git ls-files --others --exclude-standard
echo.
if exist "d:\Axiom G's\.git" (
  cd /d "d:\Axiom G's"
  echo === ROOT STATUS ===
  git status -sb
  echo === ROOT UNTRACKED ===
  git ls-files --others --exclude-standard
)
