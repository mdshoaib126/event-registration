#!/bin/bash

# SSL Certificate Setup for theprophetofmercyfoundation.com
echo "🔒 Setting up SSL certificate for theprophetofmercyfoundation.com"

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    sudo apt update
    sudo apt install certbot python3-certbot-nginx -y
fi

# Get SSL certificate
echo "🔐 Obtaining SSL certificate..."
sudo certbot --nginx -d theprophetofmercyfoundation.com -d www.theprophetofmercyfoundation.com --non-interactive --agree-tos --email admin@theprophetofmercyfoundation.com

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

echo "✅ SSL certificate installed!"
echo "🌐 Your site should now work at:"
echo "   - https://theprophetofmercyfoundation.com"
echo "   - https://www.theprophetofmercyfoundation.com"

# Test certificate
echo "🔍 Testing SSL certificate..."
curl -I https://theprophetofmercyfoundation.com