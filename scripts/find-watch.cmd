@echo off
echo === FRONTEND WATCH ===
dir /s /b "d:\Axiom G's\Axiom frontend\src\app\watch" 2>nul
echo === ROOT WATCH ===
dir /s /b "d:\Axiom G's\src\app\watch" 2>nul
echo === GIT FRONTEND ===
cd /d "d:\Axiom G's\Axiom frontend"
git ls-files "*watch*"
echo === GREP FRONTEND ===
rg -l "Related Q" "d:\Axiom G's\Axiom frontend" 2>nul
rg -l "playbackRate" "d:\Axiom G's\Axiom frontend" 2>nul
rg -l "Watch on YouTube" "d:\Axiom G's" --glob "*.tsx" 2>nul
