#!/bin/bash

# Domain Setup Script for Event Registration System
echo "🌐 Setting up domain for Event Registration System"

# Get domain name from user
if [ -z "$1" ]; then
    echo "Usage: ./setup-domain.sh yourdomain.com"
    echo "Example: ./setup-domain.sh eventregistration.com"
    exit 1
fi

DOMAIN=$1
echo "Setting up domain: $DOMAIN"

# Update frontend environment
echo "📱 Updating frontend environment..."
cd frontend
sed -i "s/yourdomain.com/$DOMAIN/g" .env.production
cp .env.production .env.local
echo "Frontend environment updated with domain: $DOMAIN"

# Update backend environment  
echo "🔧 Updating backend environment..."
cd ../backend
sed -i "s/yourdomain.com/$DOMAIN/g" .env
sed -i "s/APP_ENV=local/APP_ENV=production/g" .env
sed -i "s/APP_DEBUG=true/APP_DEBUG=false/g" .env
echo "Backend environment updated with domain: $DOMAIN"

# Update Nginx configuration
echo "🌐 Updating Nginx configuration..."
sudo sed -i "s/64.227.129.113/$DOMAIN/g" /etc/nginx/sites-available/event-registration 2>/dev/null || echo "Nginx config file not found, will need manual update"

# Clear Laravel caches
echo "🧹 Clearing Laravel caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# Rebuild frontend
echo "🔨 Rebuilding frontend..."
cd ../frontend
npm run build

# Restart services
echo "🔄 Restarting services..."
pm2 restart frontend
sudo systemctl reload nginx

echo ""
echo "✅ Domain setup completed!"
echo "🌐 Your application should now be available at: http://$DOMAIN"
echo ""
echo "📋 Next steps:"
echo "1. Update your domain's DNS A record to point to: 64.227.129.113"
echo "2. Wait for DNS propagation (can take 5-60 minutes)"
echo "3. Test your application at http://$DOMAIN"
echo ""
echo "🔧 Optional - Set up SSL certificate:"
echo "sudo certbot --nginx -d $DOMAIN"
echo ""
echo "🔍 Check DNS propagation:"
echo "nslookup $DOMAIN"
echo "dig $DOMAIN"