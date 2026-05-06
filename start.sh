#!/bin/bash

echo "🚀 Starte Backend..."
cd "/home/tamira/Dokumente/web app/automatisierung-tool"
source venv/bin/activate
python manage.py runserver &

echo "🚀 Starte Frontend..."
cd frontend
npm run dev &
