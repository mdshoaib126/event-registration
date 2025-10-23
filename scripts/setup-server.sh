#!/bin/bash

# Event Registration System - Digital Ocean Setup Script
# Run this script on a fresh Ubuntu 20.04/22.04 droplet

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

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install basic packages
print_status "Installing basic packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PHP 8.2
print_status "Installing PHP 8.2 and extensions..."
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
if ! sudo apt install -y php8.2 php8.2-fpm php8.2-mysql php8.2-xml php8.2-gd php8.2-opcache \
    php8.2-mbstring php8.2-tokenizer php8.2-json php8.2-bcmath php8.2-zip \
    php8.2-curl php8.2-cli php8.2-intl php8.2-soap php8.2-xmlrpc; then
    print_warning "PHP 8.2 installation failed, falling back to default PHP version..."
    sudo apt install -y php php-fpm php-mysql php-xml php-gd php-opcache \
        php-mbstring php-tokenizer php-json php-bcmath php-zip \
        php-curl php-cli php-intl
fi

sudo systemctl start php8.2-fpm
sudo systemctl enable php8.2-fpm

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