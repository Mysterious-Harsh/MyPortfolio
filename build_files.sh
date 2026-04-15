#!/usr/bin/env bash
set -e

# Build TypeScript → static/js/main.js
npm install
npm run build

# Collect all static files into staticfiles/
pip install --break-system-packages -r requirements.txt
python3 manage.py collectstatic --noinput
