@echo off
echo ================================
echo Environment Configuration Helper
echo ================================
echo.

set /p DB_HOST="Enter Database Host (default: 127.0.0.1): "
if "%DB_HOST%"=="" set DB_HOST=127.0.0.1

set /p DB_PORT="Enter Database Port (default: 3306): "
if "%DB_PORT%"=="" set DB_PORT=3306

set /p DB_NAME="Enter Database Name: "
if "%DB_NAME%"=="" (
    echo Database name is required!
    pause
    exit /b 1
)

set /p DB_USER="Enter Database Username: "
if "%DB_USER%"=="" (
    echo Database username is required!
    pause
    exit /b 1
)

set /p DB_PASS="Enter Database Password: "

set /p MAIL_HOST="Enter SMTP Host (optional): "
set /p MAIL_PORT="Enter SMTP Port (default: 587): "
if "%MAIL_PORT%"=="" set MAIL_PORT=587

set /p MAIL_USER="Enter SMTP Username (optional): "
set /p MAIL_PASS="Enter SMTP Password (optional): "

set /p MAIL_FROM="Enter From Email Address (optional): "
set /p APP_NAME="Enter Application Name (default: Event Registration System): "
if "%APP_NAME%"=="" set APP_NAME=Event Registration System

echo.
echo Updating backend environment file...

cd backend

REM Backup existing .env if it exists
if exist .env (
    copy .env .env.backup
    echo Existing .env backed up to .env.backup
)

REM Copy from example
copy .env.example .env

REM Update database configuration
powershell -Command "(gc .env) -replace 'DB_HOST=.*', 'DB_HOST=%DB_HOST%' | Out-File -encoding ASCII .env"
powershell -Command "(gc .env) -replace 'DB_PORT=.*', 'DB_PORT=%DB_PORT%' | Out-File -encoding ASCII .env"
powershell -Command "(gc .env) -replace 'DB_DATABASE=.*', 'DB_DATABASE=%DB_NAME%' | Out-File -encoding ASCII .env"
powershell -Command "(gc .env) -replace 'DB_USERNAME=.*', 'DB_USERNAME=%DB_USER%' | Out-File -encoding ASCII .env"
powershell -Command "(gc .env) -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=%DB_PASS%' | Out-File -encoding ASCII .env"

REM Update application name
powershell -Command "(gc .env) -replace 'APP_NAME=.*', 'APP_NAME=\"%APP_NAME%\"' | Out-File -encoding ASCII .env"

REM Update mail configuration if provided
if not "%MAIL_HOST%"=="" (
    powershell -Command "(gc .env) -replace 'MAIL_HOST=.*', 'MAIL_HOST=%MAIL_HOST%' | Out-File -encoding ASCII .env"
)
if not "%MAIL_PORT%"=="" (
    powershell -Command "(gc .env) -replace 'MAIL_PORT=.*', 'MAIL_PORT=%MAIL_PORT%' | Out-File -encoding ASCII .env"
)
if not "%MAIL_USER%"=="" (
    powershell -Command "(gc .env) -replace 'MAIL_USERNAME=.*', 'MAIL_USERNAME=%MAIL_USER%' | Out-File -encoding ASCII .env"
)
if not "%MAIL_PASS%"=="" (
    powershell -Command "(gc .env) -replace 'MAIL_PASSWORD=.*', 'MAIL_PASSWORD=%MAIL_PASS%' | Out-File -encoding ASCII .env"
)
if not "%MAIL_FROM%"=="" (
    powershell -Command "(gc .env) -replace 'MAIL_FROM_ADDRESS=.*', 'MAIL_FROM_ADDRESS=\"%MAIL_FROM%\"' | Out-File -encoding ASCII .env"
)

echo Generating application key...
call php artisan key:generate

echo.
echo Updating frontend environment file...
cd ../frontend

REM Backup existing .env.local if it exists
if exist .env.local (
    copy .env.local .env.local.backup
    echo Existing .env.local backed up to .env.local.backup
)

REM Copy from example
copy .env.example .env.local

echo.
echo ================================
echo Configuration Complete!
echo ================================
echo.
echo Database Configuration:
echo - Host: %DB_HOST%
echo - Port: %DB_PORT%
echo - Database: %DB_NAME%
echo - Username: %DB_USER%
echo.
echo Next Steps:
echo 1. Make sure your database server is running
echo 2. Create the database '%DB_NAME%' if it doesn't exist
echo 3. Run: php artisan migrate (in backend folder)
echo 4. Run: php artisan db:seed (optional - for sample data)
echo.
pause