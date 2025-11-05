#!/bin/bash
# Start Django development server

cd Shop_site
source venv/bin/activate
echo "Starting Django server on http://localhost:8000"
python manage.py runserver

