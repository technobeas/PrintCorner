@echo off
title Start Billing Server and Show QR

echo Starting Node.js server...

REM Start Node server in background
start "" /B cmd /C "node server.js"

REM Wait a bit for the server to start (adjust time if needed)
timeout /t 3 >nul

echo Generating QR code with current IP...

REM Run Python script to generate QR code with current IP
python generate_qr.py

REM Get the IPv4 address and save it to a variable
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4 Address"') do (
    set ip=%%a
)

REM Remove spaces from the IP address variable
set ip=%ip: =%

REM Build the URL with the IP
set url=http://%ip%:3000/login.html

echo Opening billing system login page at:
echo %url%

REM Open the URL in the default browser
start "" "%url%"

REM Open the generated QR code image (requires default image viewer)
start "" "billing_system_qr.png"

pause
