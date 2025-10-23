# Installation Guide

This guide will help you set up the Event Registration System quickly and easily.

## 🚀 Quick Start

### Option 1: Automatic Installation (Recommended)

**Windows:**
```bash
# 1. Run the installer
install.bat

# 2. Configure credentials
configure.bat
```

**Linux/Mac:**
```bash
# 1. Make scripts executable
chmod +x install.sh configure.sh

# 2. Run the installer
./install.sh

# 3. Configure credentials  
./configure.sh
```

### Option 2: Manual Installation

See the main README.md for detailed manual installation steps.

## 📝 Configuration

The `configure` script will ask you for:

### Database Settings
- **Host**: Usually `127.0.0.1` or `localhost`
- **Port**: Usually `3306` for MySQL
- **Database Name**: Create a new database (e.g., `event_registration`)
- **Username**: Your database username
- **Password**: Your database password

### Email Settings (Optional)
- **SMTP Host**: Your email provider's SMTP server
- **SMTP Port**: Usually `587` or `465`
- **Username**: Your SMTP username
- **Password**: Your SMTP password
- **From Email**: The email address that will send notifications

### Application Settings
- **App Name**: The name of your application

## 🏁 Final Steps

After running the configuration:

1. **Create Database** (if not exists):
   ```sql
   CREATE DATABASE event_registration;
   ```

2. **Run Migrations**:
   ```bash
   cd backend
   php artisan migrate
   ```

3. **Seed Sample Data** (Optional):
   ```bash
   php artisan db:seed
   ```

4. **Start the Servers**:
   
   **Backend** (Terminal 1):
   ```bash
   cd backend
   php artisan serve
   ```
   
   **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## 👤 Default Login

After seeding, you can login with:
- **Email**: admin@example.com
- **Password**: password

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify database credentials
   - Ensure MySQL/PostgreSQL is running
   - Check if database exists

2. **Permission Issues (Linux/Mac)**
   ```bash
   cd backend
   sudo chmod -R 775 storage bootstrap/cache
   ```

3. **Port Already in Use**
   - Backend: `php artisan serve --port=8001`
   - Frontend: `npm run dev -- --port=3001`

4. **Environment File Issues**
   - Backup and recreate: `cp .env .env.backup && cp .env.example .env`
   - Run configuration again

### Getting Help

If you encounter issues:
1. Check the main README.md for detailed troubleshooting
2. Verify all prerequisites are installed
3. Check server logs for specific error messages
4. Contact support team

## 📚 Next Steps

Once installed, you can:
- Create your first event
- Set up custom branding
- Configure email notifications  
- Import attendees
- Test the QR code check-in system

Enjoy using the Event Registration System! 🎉