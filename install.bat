@echo off
echo ================================
echo Event Registration System Setup
echo ================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if PHP is installed
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PHP is not installed. Please install PHP first.
    echo Download from: https://www.php.net/downloads
    pause
    exit /b 1
)

REM Check if Composer is installed
composer --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Composer is not installed. Please install Composer first.
    echo Download from: https://getcomposer.org/download/
    pause
    exit /b 1
)

echo All prerequisites are installed!
echo.

echo Step 1: Setting up Backend (Laravel)...
cd backend

REM Copy environment file
if not exist .env (
    copy .env.example .env
    echo Environment file created from example
) else (
    echo Environment file already exists
)

echo Installing PHP dependencies...
call composer install

echo Generating application key...
call php artisan key:generate

echo Creating storage link...
call php artisan storage:link

echo.
echo Step 2: Setting up Frontend (Next.js)...
cd ../frontend

REM Copy environment file
if not exist .env.local (
    copy .env.example .env.local
    echo Frontend environment file created from example
) else (
    echo Frontend environment file already exists
)

echo Installing Node.js dependencies...
call npm install

cd ..

echo.
echo ================================
echo Installation Complete!
echo ================================
echo.
echo Next Steps:
echo 1. Configure your database in backend/.env
echo 2. Run: php artisan migrate (in backend folder)
echo 3. Run: php artisan db:seed (optional - for sample data)
echo 4. Start backend: php artisan serve (in backend folder)
echo 5. Start frontend: npm run dev (in frontend folder)
echo.
echo Please check the README.md for detailed configuration instructions.
echo.
pause