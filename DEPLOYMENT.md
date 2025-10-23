# Event Registration System - Digital Ocean Deployment Guide

This guide will walk you through deploying your Laravel + Next.js event registration system on a Digital Ocean droplet.

## Prerequisites

- Digital Ocean droplet (Ubuntu 20.04 or 22.04 LTS recommended)
- Domain name (optional but recommended)
- SSH access to your droplet
- GitHub repository with your code

## Step 1: Initial Server Setup

### 1.1 Connect to Your Droplet

```bash
ssh root@your_droplet_ip
```

### 1.2 Update System Packages

```bash
apt update && apt upgrade -y
```

### 1.3 Create a New User (Optional but Recommended)

```bash
adduser deployer
usermod -aG sudo deployer
```

Switch to the new user:
```bash
su - deployer
```

## Step 2: Install Required Software

### 2.1 Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.2 Install PHP 8.2 and Extensions

**For Ubuntu 20.04/22.04 LTS (Recommended):**
```bash
# Add PHP repository
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP and required extensions
sudo apt install php8.2 php8.2-fpm php8.2-mysql php8.2-xml php8.2-gd php8.2-opcache php8.2-mbstring php8.2-tokenizer php8.2-json php8.2-bcmath php8.2-zip php8.2-unzip php8.2-curl php8.2-cli php8.2-intl -y
```

**For Ubuntu 24.04+ or if PPA fails (Alternative method):**
```bash
# Install default PHP version and extensions
sudo apt update
sudo apt install php php-fpm php-mysql php-xml php-gd php-opcache php-mbstring php-tokenizer php-json php-bcmath php-zip php-curl php-cli php-intl -y

# Check PHP version
php --version
```

**Note:** If you're using Ubuntu 24.04 or newer, the default repositories should include PHP 8.1+ which is compatible with Laravel. The `php-unzip` package is not needed as ZIP functionality is included in `php-zip`.

# Start and enable PHP-FPM
```bash
# For PHP 8.2 (if installed via PPA)
sudo systemctl start php8.2-fpm
sudo systemctl enable php8.2-fpm

# For default PHP version (if PPA failed)
sudo systemctl start php8.1-fpm  # or php8.3-fpm depending on your version
sudo systemctl enable php8.1-fpm  # adjust version accordingly
```

### 2.3 Install MySQL

```bash
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation
sudo mysql_secure_installation
```

Follow the prompts:
- Set root password: **Yes** (choose a strong password)
- Remove anonymous users: **Yes**
- Disallow root login remotely: **Yes**
- Remove test database: **Yes**
- Reload privilege tables: **Yes**

### 2.4 Install Composer

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
```

### 2.5 Install Node.js and npm

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2.6 Install PM2

```bash
sudo npm install -g pm2
```

### 2.7 Install Git

```bash
sudo apt install git -y
```

## Step 3: Setup Database

### 3.1 Create Database and User

```bash
sudo mysql -u root -p
```

In MySQL console:
```sql
CREATE DATABASE event_registration;
CREATE USER 'event_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON event_registration.* TO 'event_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 4: Deploy the Application

### 4.1 Clone Your Repository

```bash
cd /var/www
sudo git clone https://github.com/your-username/event-registration.git
sudo chown -R deployer:deployer event-registration
cd event-registration
```

### 4.2 Setup Laravel Backend

```bash
cd backend

# Install PHP dependencies
composer install --no-dev --optimize-autoloader

# Create environment file
cp .env.example .env
```

### 4.3 Configure Laravel Environment

Edit the `.env` file:
```bash
nano .env
```

Update the following variables:
```env
APP_NAME="Event Registration"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://your-domain.com

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=event_registration
DB_USERNAME=event_user
DB_PASSWORD=your_strong_password

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

JWT_SECRET=
JWT_ALGO=HS256

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"
```

### 4.4 Generate Application Key and JWT Secret

```bash
php artisan key:generate
php artisan jwt:secret
```

### 4.5 Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/event-registration
sudo chmod -R 755 /var/www/event-registration
sudo chmod -R 775 /var/www/event-registration/backend/storage
sudo chmod -R 775 /var/www/event-registration/backend/bootstrap/cache
```

### 4.6 Run Database Migrations

```bash
php artisan migrate --force
```

### 4.7 Create Storage Link

```bash
php artisan storage:link
```

### 4.8 Cache Configuration

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Step 5: Setup Frontend (Next.js)

### 5.1 Install Dependencies and Build

```bash
cd /var/www/event-registration/frontend

# Install dependencies
npm install

# Create production environment file
cp .env.local.example .env.local
```

### 5.2 Configure Frontend Environment

Edit `.env.local`:
```bash
nano .env.local
```

Update with your backend URL:
```env
NEXT_PUBLIC_API_URL=http://your-domain.com/api
```

### 5.3 Build the Application

```bash
npm run build
```

## Step 6: Configure Nginx

### 6.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/event-registration
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API (Laravel)
    location /api {
        try_files $uri $uri/ @laravel;
    }
    
    location @laravel {
        root /var/www/event-registration/backend/public;
        # Adjust PHP version based on your installation
        # For PHP 8.2: fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        # For PHP 8.1: fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        # For PHP 8.3: fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root/index.php;
        include fastcgi_params;
    }
    
    # Laravel static files
    location /storage {
        alias /var/www/event-registration/backend/storage/app/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 6.2 Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/event-registration /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## Step 7: Setup PM2 for Next.js

### 7.1 Create PM2 Configuration

```bash
cd /var/www/event-registration/frontend
nano ecosystem.config.js
```

Add the following:
```javascript
module.exports = {
  apps: [
    {
      name: 'event-registration-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/event-registration/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

### 7.2 Start the Application

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Follow the command output to enable PM2 startup script.

## Step 8: Setup SSL Certificate (Optional but Recommended)

### 8.1 Install Certbot

```bash
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 8.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 9: Setup Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## Step 10: Final Steps and Testing

### 10.1 Create Admin User

```bash
cd /var/www/event-registration/backend
php artisan tinker
```

In the tinker console:
```php
$user = new App\Models\User();
$user->name = 'Admin User';
$user->email = 'admin@yourdomain.com';
$user->password = Hash::make('your_admin_password');
$user->role = 'admin';
$user->save();
exit
```

### 10.2 Test the Application

1. Visit your domain in a browser
2. Check if the frontend loads properly
3. Test the admin login at `/auth/login`
4. Verify API endpoints are working

### 10.3 Setup Log Monitoring

```bash
# Monitor PM2 logs
pm2 logs

# Monitor Laravel logs
tail -f /var/www/event-registration/backend/storage/logs/laravel.log

# Monitor Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Deployment Script (Optional)

Create a deployment script for future updates:

```bash
nano /var/www/event-registration/deploy.sh
```

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /var/www/event-registration

# Pull latest changes
git pull origin main

# Backend deployment
cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend deployment
cd ../frontend
npm install
npm run build

# Restart PM2
pm2 restart event-registration-frontend

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Deployment completed!"
```

Make it executable:
```bash
chmod +x /var/www/event-registration/deploy.sh
```

## Maintenance Commands

### Update the Application
```bash
./deploy.sh
```

### Check PM2 Status
```bash
pm2 status
pm2 logs event-registration-frontend
```

### Restart Services
```bash
# Restart PM2 app
pm2 restart event-registration-frontend

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm

# Restart Nginx
sudo systemctl restart nginx

# Restart MySQL
sudo systemctl restart mysql
```

### Database Backup
```bash
mysqldump -u event_user -p event_registration > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Troubleshooting

### Common Issues

1. **500 Error**: Check Laravel logs in `backend/storage/logs/laravel.log`
2. **Permission Issues**: Run `sudo chown -R www-data:www-data /var/www/event-registration`
3. **Database Connection**: Verify MySQL credentials in `.env`
4. **Frontend Not Loading**: Check PM2 logs with `pm2 logs`
5. **API Not Working**: Check Nginx configuration and PHP-FPM status

### Performance Optimization

1. **Enable OPcache**: Already included in PHP installation
2. **Database Indexing**: Monitor slow queries and add indexes as needed
3. **CDN**: Consider using a CDN for static assets
4. **Caching**: Implement Redis for session and cache storage

## Security Checklist

- ✅ Firewall configured
- ✅ SSL certificate installed
- ✅ Strong database passwords
- ✅ Regular backups scheduled
- ✅ System updates automated
- ✅ Non-root user for deployment
- ✅ Secure file permissions

Your event registration system should now be live and accessible on your Digital Ocean droplet!