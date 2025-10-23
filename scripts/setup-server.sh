#!/bin/bash

# Event Registration System - Digital Ocean Setup Script
# Optimize PHP configuration
print_status "Optimizing PHP configuration..."

# Detect PHP version
PHP_VERSION=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
print_status "Detected PHP version: $PHP_VERSION"

# Check if PHP config file exists and optimize
PHP_CONFIG="/etc/php/$PHP_VERSION/fpm/php.ini"
if [ -f "$PHP_CONFIG" ]; then
    sudo sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 64M/' "$PHP_CONFIG"
    sudo sed -i 's/post_max_size = 8M/post_max_size = 64M/' "$PHP_CONFIG"
    sudo sed -i 's/max_execution_time = 30/max_execution_time = 300/' "$PHP_CONFIG"
    sudo sed -i 's/max_input_vars = 1000/max_input_vars = 3000/' "$PHP_CONFIG"
    sudo sed -i 's/memory_limit = 128M/memory_limit = 256M/' "$PHP_CONFIG"
    
    # Restart PHP-FPM
    sudo systemctl restart php$PHP_VERSION-fpm
    print_status "PHP configuration optimized"
else
    print_warning "PHP config file not found at $PHP_CONFIG"
    print_warning "You may need to optimize PHP settings manually"
fi script on a fresh Ubuntu 20.04/22.04 droplet

set -e

echo "🚀 Starting Event Registration System setup on Digital Ocean..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_warning "This script should not be run as root for security reasons"
   print_warning "Please create a non-root user and run this script with sudo privileges"
   exit 1
fi
 

# Install MySQL
print_status "Installing MySQL..."
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

print_warning "Please run 'sudo mysql_secure_installation' after this script completes"

# Install Composer
print_status "Installing Composer..."
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
print_status "Installing PM2..."
sudo npm install -g pm2

# Create directory for the application
print_status "Creating application directory..."
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Optimize PHP configuration
print_status "Optimizing PHP configuration..."
sudo sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 64M/' /etc/php/8.2/fpm/php.ini
sudo sed -i 's/post_max_size = 8M/post_max_size = 64M/' /etc/php/8.2/fpm/php.ini
sudo sed -i 's/max_execution_time = 30/max_execution_time = 300/' /etc/php/8.2/fpm/php.ini
sudo sed -i 's/max_input_vars = 1000/max_input_vars = 3000/' /etc/php/8.2/fpm/php.ini
sudo sed -i 's/memory_limit = 128M/memory_limit = 256M/' /etc/php/8.2/fpm/php.ini

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm

print_status "✅ Basic setup completed!"
print_status ""
print_status "Next steps:"
print_status "1. Run: sudo mysql_secure_installation"
print_status "2. Create database and user in MySQL"
print_status "3. Clone your repository to /var/www/"
print_status "4. Follow the deployment guide for application setup"
print_status ""
print_status "Installed software versions:"
echo "- PHP: $(php --version | head -n 1)"
echo "- Node.js: $(node --version)"
echo "- npm: $(npm --version)"
echo "- Composer: $(composer --version)"
echo "- Nginx: $(nginx -v 2>&1)"
echo "- MySQL: $(mysql --version)"

print_status "🎉 Server setup completed successfully!"