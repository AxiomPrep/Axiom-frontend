@echo off
cd /d "d:\Axiom G's\Axiom frontend"
git status -sb
echo HEAD:
git rev-parse HEAD
echo ORIGIN:
git rev-parse origin/main
echo UNPUSHED:
git log origin/main..HEAD --oneline
echo NUMSTAT:
git diff --numstat
