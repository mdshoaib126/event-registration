#!/bin/bash

echo "================================"
echo "Event Registration System Setup"
echo "================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo "ERROR: PHP is not installed. Please install PHP first."
    exit 1
fi

# Check if Composer is installed
if ! command -v composer &> /dev/null; then
    echo "ERROR: Composer is not installed. Please install Composer first."
    echo "Download from: https://getcomposer.org/download/"
    exit 1
fi

echo "All prerequisites are installed!"
echo

echo "Step 1: Setting up Backend (Laravel)..."
cd backend

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Environment file created from example"
else
    echo "Environment file already exists"
fi

echo "Installing PHP dependencies..."
composer install

echo "Generating application key..."
php artisan key:generate

echo "Creating storage link..."
php artisan storage:link

echo
echo "Step 2: Setting up Frontend (Next.js)..."
cd ../frontend

# Copy environment file
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "Frontend environment file created from example"
else
    echo "Frontend environment file already exists"
fi

echo "Installing Node.js dependencies..."
npm install

cd ..

echo
echo "================================"
echo "Installation Complete!"
echo "================================"
echo
echo "Next Steps:"
echo "1. Configure your database in backend/.env"
echo "2. Run: php artisan migrate (in backend folder)"
echo "3. Run: php artisan db:seed (optional - for sample data)"
echo "4. Start backend: php artisan serve (in backend folder)"
echo "5. Start frontend: npm run dev (in frontend folder)"
echo
echo "Please check the README.md for detailed configuration instructions."
echo