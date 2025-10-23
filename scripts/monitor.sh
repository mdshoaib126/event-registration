#!/bin/bash

# Event Registration System - Monitoring Script
# Use this script to check the health of your application

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

clear
print_info "🔍 Event Registration System Health Check"
print_info "$(date)"
echo "=================================================="

# Check system resources
print_info "\n📊 System Resources:"
echo "Memory Usage: $(free -h | grep '^Mem:' | awk '{print $3 "/" $2}')"
echo "Disk Usage: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
echo "CPU Load: $(uptime | awk '{print $10 $11 $12}')"

# Check services status
print_info "\n🔧 Services Status:"

# Nginx
if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx is running"
else
    print_error "Nginx is not running"
fi

# PHP-FPM
if sudo systemctl is-active --quiet php8.2-fpm; then
    print_status "PHP-FPM is running"
else
    print_error "PHP-FPM is not running"
fi

# MySQL
if sudo systemctl is-active --quiet mysql; then
    print_status "MySQL is running"
else
    print_error "MySQL is not running"
fi

# PM2 Application
print_info "\n🚀 PM2 Application Status:"
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "event-registration-frontend"; then
        if pm2 list | grep -q "online.*event-registration-frontend"; then
            print_status "Frontend application is running"
        else
            print_error "Frontend application is not online"
        fi
    else
        print_error "Frontend application not found in PM2"
    fi
    
    echo ""
    pm2 list
else
    print_error "PM2 is not installed"
fi

# Database connection test
print_info "\n🗄️  Database Connection:"
if [ -f "/var/www/event-registration/backend/.env" ]; then
    cd /var/www/event-registration/backend
    if php artisan migrate:status > /dev/null 2>&1; then
        print_status "Database connection successful"
    else
        print_error "Database connection failed"
    fi
else
    print_warning "Backend .env file not found"
fi

# Check disk space
print_info "\n💾 Disk Space Check:"
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    print_error "Disk usage is above 90% ($DISK_USAGE%)"
elif [ $DISK_USAGE -gt 80 ]; then
    print_warning "Disk usage is above 80% ($DISK_USAGE%)"
else
    print_status "Disk usage is normal ($DISK_USAGE%)"
fi

# Check memory usage
print_info "\n🧠 Memory Usage Check:"
MEMORY_USAGE=$(free | grep '^Mem:' | awk '{printf "%.0f", $3/$2 * 100}')
if [ $MEMORY_USAGE -gt 90 ]; then
    print_error "Memory usage is above 90% ($MEMORY_USAGE%)"
elif [ $MEMORY_USAGE -gt 80 ]; then
    print_warning "Memory usage is above 80% ($MEMORY_USAGE%)"
else
    print_status "Memory usage is normal ($MEMORY_USAGE%)"
fi

# Check log files for errors
print_info "\n📋 Recent Error Logs:"

# Laravel logs
if [ -f "/var/www/event-registration/backend/storage/logs/laravel.log" ]; then
    ERROR_COUNT=$(tail -100 /var/www/event-registration/backend/storage/logs/laravel.log | grep -c "ERROR" || true)
    if [ $ERROR_COUNT -gt 0 ]; then
        print_warning "Found $ERROR_COUNT Laravel errors in last 100 log entries"
    else
        print_status "No recent Laravel errors found"
    fi
fi

# Nginx error logs
if [ -f "/var/log/nginx/error.log" ]; then
    NGINX_ERRORS=$(tail -100 /var/log/nginx/error.log | wc -l)
    if [ $NGINX_ERRORS -gt 10 ]; then
        print_warning "Found $NGINX_ERRORS Nginx error entries in last 100 lines"
    else
        print_status "Nginx error log looks normal"
    fi
fi

# Check SSL certificate (if applicable)
print_info "\n🔒 SSL Certificate Check:"
if command -v openssl &> /dev/null; then
    # Try to check SSL cert for common domain patterns
    if [ ! -z "$1" ]; then
        DOMAIN=$1
        EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
        if [ ! -z "$EXPIRY" ]; then
            print_status "SSL certificate expires: $EXPIRY"
        else
            print_warning "Could not retrieve SSL certificate information"
        fi
    else
        print_info "Run with domain name to check SSL: ./monitor.sh yourdomain.com"
    fi
else
    print_warning "OpenSSL not available for SSL certificate check"
fi

# Network connectivity test
print_info "\n🌐 Network Connectivity:"
if ping -c 1 google.com &> /dev/null; then
    print_status "Internet connectivity is working"
else
    print_error "Internet connectivity issues detected"
fi

# Recent deployment info
print_info "\n📦 Deployment Information:"
if [ -d "/var/www/event-registration/.git" ]; then
    cd /var/www/event-registration
    print_info "Current branch: $(git branch --show-current)"
    print_info "Last commit: $(git log --oneline -1)"
    print_info "Last deployment: $(stat -c %y deploy.sh 2>/dev/null || echo 'Unknown')"
fi

echo ""
echo "=================================================="
print_info "Health check completed at $(date)"

# Quick command reference
print_info "\n📚 Quick Commands:"
echo "- View PM2 logs: pm2 logs event-registration-frontend"
echo "- Restart PM2: pm2 restart event-registration-frontend"
echo "- View Laravel logs: tail -f /var/www/event-registration/backend/storage/logs/laravel.log"
echo "- View Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "- Restart services: sudo systemctl restart nginx php8.2-fpm"
echo "- Deploy updates: cd /var/www/event-registration && ./deploy.sh"