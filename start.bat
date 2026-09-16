@echo off
echo ========================================================
echo Starting Campus Lost & Found System...
echo ========================================================

echo Starting Backend Server on http://127.0.0.1:8000 ...
start "Lost & Found Backend" cmd /k "cd backend && python manage.py runserver 127.0.0.1:8000"

echo Starting Frontend Server on http://127.0.0.1:5500 ...
start "Lost & Found Frontend" cmd /k "cd frontend && python -m http.server 5500 --bind 127.0.0.1"

timeout /t 2 >nul
echo Opening application in default browser...
start http://127.0.0.1:5500

echo ========================================================
echo App is running!
echo Frontend: http://127.0.0.1:5500
echo Backend API: http://127.0.0.1:8000/api/items/
echo Admin Panel: http://127.0.0.1:8000/admin/
echo ========================================================
pause
