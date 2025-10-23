# Deployment Scripts

This directory contains scripts to help with deploying and managing your Event Registration System on Digital Ocean.

## Scripts Overview

### 1. `setup-server.sh`
**Purpose**: Initial server setup on a fresh Ubuntu droplet

**What it does**:
- Updates system packages
- Installs Nginx, PHP 8.2, MySQL, Node.js, PM2
- Configures firewall
- Optimizes PHP settings

**Usage**:
```bash
chmod +x scripts/setup-server.sh
./scripts/setup-server.sh
```

**Run this first** on a new droplet.

### 2. `setup-database.sh`
**Purpose**: Create MySQL database and user for the application

**What it does**:
- Creates database and user
- Sets proper permissions
- Tests database connection

**Usage**:
```bash
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

**Run after** `setup-server.sh` and MySQL secure installation.

### 3. `deploy.sh`
**Purpose**: Deploy application updates

**What it does**:
- Pulls latest code from Git
- Updates dependencies
- Runs migrations
- Builds frontend
- Restarts services
- Creates backup

**Usage**:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Run this** whenever you want to deploy updates.

### 4. `monitor.sh`
**Purpose**: Health check and monitoring

**What it does**:
- Checks service status
- Monitors resource usage
- Shows recent errors
- Displays deployment info

**Usage**:
```bash
chmod +x scripts/monitor.sh
./scripts/monitor.sh [domain.com]
```

**Run this** to check system health.

## Quick Setup Guide

### On Your Local Machine

1. **Prepare your code**:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### On Your Digital Ocean Droplet

1. **Initial setup**:
```bash
# Clone your repository
git clone https://github.com/your-username/event-registration.git
cd event-registration

# Make scripts executable
chmod +x scripts/*.sh

# Run server setup
./scripts/setup-server.sh

# Secure MySQL (when prompted)
sudo mysql_secure_installation

# Setup database
./scripts/setup-database.sh
```

2. **Configure application**:
```bash
# Backend setup
cd backend
cp .env.example .env
nano .env  # Edit database credentials and other settings
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan jwt:secret
php artisan migrate --force
php artisan storage:link

# Frontend setup
cd ../frontend
cp .env.local.example .env.local
nano .env.local  # Edit API URL
npm install
npm run build
```

3. **Configure web server**:
```bash
# Copy the Nginx configuration from DEPLOYMENT.md
sudo nano /etc/nginx/sites-available/event-registration
sudo ln -s /etc/nginx/sites-available/event-registration /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

4. **Start PM2**:
```bash
cd frontend
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the instructions
```

5. **Set permissions**:
```bash
sudo chown -R www-data:www-data /var/www/event-registration
sudo chmod -R 755 /var/www/event-registration
sudo chmod -R 775 /var/www/event-registration/backend/storage
sudo chmod -R 775 /var/www/event-registration/backend/bootstrap/cache
```

6. **Create admin user**:
```bash
cd backend
php artisan tinker
```
```php
$user = new App\Models\User();
$user->name = 'Admin User';
$user->email = 'admin@yourdomain.com';
$user->password = Hash::make('your_password');
$user->role = 'admin';
$user->save();
exit
```

## Deployment Workflow

### For Updates

```bash
# On your local machine
git add .
git commit -m "Your update message"
git push origin main

# On your server
cd /var/www/event-registration
./scripts/deploy.sh
```

### For Monitoring

```bash
# Check system health
./scripts/monitor.sh yourdomain.com

# View logs
pm2 logs event-registration-frontend
tail -f backend/storage/logs/laravel.log
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Common Issues

1. **Permission errors**: Run `sudo chown -R www-data:www-data /var/www/event-registration`
2. **PHP errors**: Check `backend/storage/logs/laravel.log`
3. **Frontend not loading**: Check `pm2 logs event-registration-frontend`
4. **Database issues**: Verify credentials in `.env` file

### Service Management

```bash
# Restart services
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
sudo systemctl restart mysql
pm2 restart event-registration-frontend

# Check service status
sudo systemctl status nginx
sudo systemctl status php8.2-fpm
sudo systemctl status mysql
pm2 status
```

## File Locations

- **Application**: `/var/www/event-registration`
- **Nginx config**: `/etc/nginx/sites-available/event-registration`
- **Laravel logs**: `/var/www/event-registration/backend/storage/logs/`
- **Nginx logs**: `/var/log/nginx/`
- **PM2 logs**: `pm2 logs`

## Security Notes

- Always use strong passwords
- Keep your system updated
- Regular backups are created automatically during deployment
- Monitor logs regularly for suspicious activity
- Consider setting up automated SSL certificate renewal

For detailed instructions, see the main `DEPLOYMENT.md` file.