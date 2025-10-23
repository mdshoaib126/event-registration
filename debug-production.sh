#!/bin/bash

# Debug Script for Production Environment
echo "🔍 Debugging Event Registration System..."

echo "📊 System Information:"
echo "Date: $(date)"
echo "Server IP: $(curl -s ifconfig.me)"
echo "Node Version: $(node --version)"
echo "NPM Version: $(npm --version)"
echo "PHP Version: $(php --version | head -n 1)"

echo ""
echo "📋 PM2 Status:"
pm2 status

echo ""
echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "📱 Frontend Logs (last 20 lines):"
pm2 logs frontend --lines 20

echo ""
echo "🔧 Backend Laravel Logs (last 10 lines):"
tail -n 10 backend/storage/logs/laravel.log

echo ""
echo "📡 Test API Endpoints:"
echo "Testing health endpoint..."
curl -s http://localhost/api/health | jq . || echo "Health endpoint failed"

echo ""
echo "Testing login endpoint..."
curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@eventregistration.com","password":"password123"}' | jq . || echo "Login endpoint failed"

echo ""
echo "🔍 Environment Variables:"
echo "NEXT_PUBLIC_API_URL from frontend/.env.local:"
grep NEXT_PUBLIC_API_URL frontend/.env.local || echo "Environment file not found"

echo ""
echo "📁 File Permissions:"
ls -la frontend/.env.local frontend/.env.production || echo "Environment files not found"

echo ""
echo "✅ Debug information collected!"
echo "💡 If localStorage is not working, check browser console for errors"
echo "💡 Make sure the frontend is using the production environment file"