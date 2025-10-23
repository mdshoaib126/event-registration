#!/bin/bash

# Production Deployment Script for Event Registration System
echo "🚀 Starting production deployment..."

# Pull latest changes
echo "📥 Pulling latest changes from repository..."
git pull origin main

# Update backend
echo "🔧 Updating backend..."
cd backend
composer install --optimize-autoloader --no-dev
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Update frontend with production environment
echo "🎨 Updating frontend with production environment..."
cd ../frontend

# Copy production environment file
cp .env.production .env.local

# Install dependencies and build
npm install
npm run build

# Stop PM2 processes
echo "⏹️ Stopping PM2 processes..."
pm2 stop frontend || true

# Start frontend with PM2
echo "▶️ Starting frontend with PM2..."
pm2 start npm --name "frontend" -- start

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment completed!"
echo "🌐 Your application should now be available at: http://64.227.129.113"
echo ""
echo "📋 To check status:"
echo "  - PM2 processes: pm2 status"
echo "  - Nginx status: sudo systemctl status nginx"
echo "  - Application logs: pm2 logs frontend"