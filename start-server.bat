@echo off
echo ====================================
echo   Starting Local Web Server
echo ====================================
echo.
echo Your app will be available at:
echo   - On this computer: http://localhost:8080
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo   - On your phone: http://!IP!:8080
)

echo.
echo Press Ctrl+C to stop the server
echo ====================================
echo.

php -S 0.0.0.0:8080
