#!/bin/bash

# Fix CORS and environment configuration
echo "🔧 Fixing CORS configuration for both IP and domain access..."

# Copy CORS configuration to backend
cd backend
if [ ! -f "config/cors.php" ]; then
    cp ../cors.php config/cors.php
    echo "� CORS configuration file created"
fi

# Update backend .env to allow all origins for now
if ! grep -q "FRONTEND_URL" .env; then
    echo "FRONTEND_URL=*" >> .env
else
    sed -i 's/FRONTEND_URL=.*/FRONTEND_URL=*/' .env
fi

echo "🔧 Backend CORS updated to allow all origins"

# Clear Laravel caches
php artisan config:clear
php artisan cache:clear

# Rebuild frontend
cd ../frontend
npm run build

# Restart PM2 processes
pm2 restart frontend

echo "✅ CORS configuration updated!"
echo "🌐 Both IP and domain should now work:"
echo "   - IP: http://64.227.129.113" 
echo "   - Domain: http://theprophetofmercyfoundation.com"