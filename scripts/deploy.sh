#!/bin/bash

# Event Registration System - Deployment Script
# Use this script to deploy updates to your production server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/event-registration"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BRANCH="main"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory $PROJECT_DIR does not exist!"
    exit 1
fi

print_status "🚀 Starting deployment..."
print_status "Project directory: $PROJECT_DIR"
print_status "Branch: $BRANCH"
print_status ""

# Navigate to project directory
cd $PROJECT_DIR

# Check Git status
print_step "Checking Git status..."
git status

# Backup current state (optional)
print_step "Creating backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/event-registration-$TIMESTAMP"
sudo mkdir -p /var/backups
sudo cp -r $PROJECT_DIR $BACKUP_DIR
print_status "Backup created at: $BACKUP_DIR"

# Pull latest changes
print_step "Pulling latest changes from Git..."
git fetch origin
git pull origin $BRANCH

# Backend deployment
print_step "Deploying backend (Laravel)..."
cd $BACKEND_DIR

# Install/update PHP dependencies
print_status "Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# Clear and cache configuration
print_status "Clearing and caching configuration..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Run database migrations
print_status "Running database migrations..."
php artisan migrate --force

# Cache configuration for production
print_status "Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Optimize for production
print_status "Optimizing for production..."
composer dump-autoload --optimize

# Frontend deployment
print_step "Deploying frontend (Next.js)..."
cd $FRONTEND_DIR

# Install/update Node.js dependencies
print_status "Installing Node.js dependencies..."
npm ci --only=production

# Build the application
print_status "Building Next.js application..."
npm run build

# Restart PM2 application
print_step "Restarting PM2 application..."
if pm2 list | grep -q "event-registration-frontend"; then
    pm2 restart event-registration-frontend
    pm2 save
    print_status "PM2 application restarted"
else
    print_warning "PM2 application not found. Starting new instance..."
    pm2 start ecosystem.config.js
    pm2 save
fi

# Set correct permissions
print_step "Setting file permissions..."
sudo chown -R www-data:www-data $PROJECT_DIR
sudo chmod -R 755 $PROJECT_DIR
sudo chmod -R 775 $BACKEND_DIR/storage
sudo chmod -R 775 $BACKEND_DIR/bootstrap/cache

# Restart services
print_step "Restarting services..."
sudo systemctl reload php8.2-fpm
sudo systemctl reload nginx

# Health check
print_step "Performing health check..."
sleep 5

# Check if PM2 app is running
if pm2 list | grep -q "online.*event-registration-frontend"; then
    print_status "✅ PM2 application is running"
else
    print_error "❌ PM2 application is not running properly"
    pm2 logs event-registration-frontend --lines 20
fi

# Check Nginx status
if sudo systemctl is-active --quiet nginx; then
    print_status "✅ Nginx is running"
else
    print_error "❌ Nginx is not running"
fi

# Check PHP-FPM status
if sudo systemctl is-active --quiet php8.2-fpm; then
    print_status "✅ PHP-FPM is running"
else
    print_error "❌ PHP-FPM is not running"
fi

# Test database connection
cd $BACKEND_DIR
if php artisan migrate:status > /dev/null 2>&1; then
    print_status "✅ Database connection is working"
else
    print_error "❌ Database connection failed"
fi

print_status ""
print_status "🎉 Deployment completed successfully!"
print_status ""
print_status "Summary:"
print_status "- Git branch: $(git branch --show-current)"
print_status "- Last commit: $(git log --oneline -1)"
print_status "- Deployment time: $(date)"
print_status "- Backup location: $BACKUP_DIR"
print_status ""
print_status "Useful commands for monitoring:"
print_status "- PM2 logs: pm2 logs event-registration-frontend"
print_status "- Laravel logs: tail -f $BACKEND_DIR/storage/logs/laravel.log"
print_status "- Nginx logs: sudo tail -f /var/log/nginx/error.log"