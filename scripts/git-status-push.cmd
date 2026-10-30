@echo off
cd /d "d:\Axiom G's\Axiom frontend"
echo === STATUS ===
git status -sb
echo === LOG ===
git log -5 --format="%%h | %%an | %%ae | %%s"
echo === REAL DIFF ===
git diff --ignore-cr-at-eol --stat
echo === STAGED ===
git diff --cached --stat
echo === UNTRACKED ===
git ls-files --others --exclude-standard
echo === UNPUSHED ===
git log origin/main..HEAD --format="%%h | %%an | %%ae | %%s"
echo === HEAD vs ORIGIN ===
git rev-parse --short HEAD
git rev-parse --short origin/main
echo === BACKEND ===
cd /d "d:\Axiom G's\backend"
git status -sb
git log origin/main..HEAD --format="%%h | %%an | %%ae | %%s"
git diff --ignore-cr-at-eol --stat
git ls-files --others --exclude-standard
