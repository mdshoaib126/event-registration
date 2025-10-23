# Event Registration and Management System

A comprehensive event management platform with Laravel backend and Next.js frontend, featuring QR code-based check-in system, custom branding, and attendee management.

## 🚀 Features

- **Event Management**: Create, edit, and manage events with custom branding
- **Attendee Registration**: Public registration forms with custom fields
- **QR Code System**: Unique QR codes for each attendee with check-in functionality
- **Role-based Access**: Admin and Event Staff roles with different permissions
- **Mobile-friendly**: Responsive design for mobile QR scanning
- **Custom Branding**: Upload logos and customize theme colors
- **Bulk Import**: CSV/Excel import for attendees
- **Reporting**: Export attendee data and generate reports

## 📋 Tech Stack

- **Backend**: Laravel 12 with JWT authentication
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Database**: MySQL
- **QR Generation**: Endroid QR Code library
- **File Storage**: Local storage for logos and QR codes

## ⚙️ Quick Installation

### Automatic Setup

**Windows Users:**
```bash
# Run the installer
install.bat
```

**Linux/Mac Users:**
```bash
# Make installer executable and run
chmod +x install.sh
./install.sh
```

### Prerequisites
- PHP 8.2+ with extensions (BCMath, Ctype, Fileinfo, JSON, Mbstring, OpenSSL, PDO, Tokenizer, XML)
- Composer
- Node.js 18+ 
- NPM/Yarn
- MySQL/PostgreSQL

### Manual Installation

#### Backend Setup (Laravel)

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   composer install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Or use the configuration helper:
   # Windows: configure.bat
   # Linux/Mac: ./configure.sh
   ```

4. Generate application key:
   ```bash
   php artisan key:generate
   ```

5. Create storage link:
   ```bash
   php artisan storage:link
   ```

6. Run migrations and seed data:
   ```bash
   php artisan migrate
   php artisan db:seed --class=AdminUserSeeder
   ```

7. Start Laravel server:
   ```bash
   php artisan serve
   ```
   Backend will be available at: `http://127.0.0.1:8000`

### Frontend Setup (Next.js)

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env.local
   # Update API URL if needed
   NEXT_PUBLIC_STORAGE_URL=http://localhost:8000/storage
   ```

4. Start development server:
   ```bash
   npm run dev
   ```
   Frontend will be available at: `http://localhost:3000`

## 🔐 Default Credentials

**Administrator Access:**
- Email: `admin@eventregistration.com`
- Password: `password123`

**Event Staff Access:**
- Email: `staff@eventregistration.com`
- Password: `password123`

## 📱 Usage

### For Administrators:
1. Login at `/auth/login`
2. Access admin dashboard at `/admin`
3. Create and manage events
4. View attendee lists and reports
5. Configure branding settings

### For Event Staff:
1. Login at `/auth/login`
2. Access QR scanner at `/staff`
3. Scan attendee QR codes for check-in
4. View check-in history

### For Attendees:
1. Visit event registration page at `/register/[event-slug]`
2. Fill out registration form
3. Receive QR code via email
4. Present QR code at event for check-in

## 🔧 System Architecture

### API Endpoints

**Authentication:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/user-profile` - Get user profile

**Events:**
- `GET /api/events` - List events (Admin)
- `POST /api/events` - Create event (Admin)
- `GET /api/public/events/{slug}` - Public event details

**Attendees:**
- `POST /api/public/events/{slug}/register` - Public registration
- `GET /api/events/{id}/attendees` - List attendees
- `POST /api/attendees/{id}/checkin` - Check-in attendee

**QR Codes:**
- `POST /api/qr-codes/scan` - Scan QR code
- `GET /api/public/qr-codes/{id}/download` - Download QR code

### Database Schema

- `users` - System users (Admin/Staff)
- `events` - Event information
- `attendees` - Registration data
- `qr_codes` - QR code tracking
- `client_branding` - Branding configuration

## 🎨 Customization

### Branding
- Upload organizer logo in Admin panel
- Customize primary, secondary, and accent colors
- Set company name and description

### Event Forms
- Add custom registration fields
- Configure required/optional fields
- Support text, email, select, and textarea fields

## 📊 Reports & Export

- Export attendee data as CSV or Excel
- Filter by ticket type, company, check-in status
- Generate attendance reports
- Real-time dashboard statistics

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Encrypted QR code data
- Input validation and sanitization
- CORS protection

## 🚀 Deployment

### Production Setup
1. Configure production environment variables
2. Set up SSL certificates
3. Configure web server (Nginx/Apache)
4. Set up database backups
5. Configure file storage permissions

### Environment Variables
```env
# Laravel Backend
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=event_registration
JWT_SECRET=your-jwt-secret

# Next.js Frontend
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_STORAGE_URL=https://your-domain.com/storage
```

## 📞 Support

For technical support or questions:
- Check the API documentation at backend root URL
- Review log files for troubleshooting
- Verify database connections and permissions

## 📄 License

This project is licensed under the MIT License.

---

**Event Registration System v1.0.0**
Professional event management made simple.