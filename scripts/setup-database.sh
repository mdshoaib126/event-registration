#!/bin/bash

# Event Registration System - Database Setup Script
# This script helps set up the MySQL database and user

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Default values
DB_NAME="event_registration"
DB_USER="event_user"
DB_HOST="localhost"

print_status "🗄️  Event Registration Database Setup"
print_status ""

# Get database details from user
read -p "Database name [$DB_NAME]: " input_db_name
DB_NAME=${input_db_name:-$DB_NAME}

read -p "Database user [$DB_USER]: " input_db_user
DB_USER=${input_db_user:-$DB_USER}

read -s -p "Database password (will be hidden): " DB_PASSWORD
echo ""

read -s -p "MySQL root password: " ROOT_PASSWORD
echo ""

print_status "Creating database setup..."

# Create SQL commands
SQL_COMMANDS="
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'$DB_HOST' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'$DB_HOST';
FLUSH PRIVILEGES;
"

# Execute SQL commands
print_step "Creating database and user..."
echo "$SQL_COMMANDS" | mysql -u root -p"$ROOT_PASSWORD"

if [ $? -eq 0 ]; then
    print_status "✅ Database setup completed successfully!"
    print_status ""
    print_status "Database Details:"
    print_status "- Database: $DB_NAME"
    print_status "- User: $DB_USER"
    print_status "- Host: $DB_HOST"
    print_status ""
    print_status "Add these to your .env file:"
    echo "DB_CONNECTION=mysql"
    echo "DB_HOST=$DB_HOST"
    echo "DB_PORT=3306"
    echo "DB_DATABASE=$DB_NAME"
    echo "DB_USERNAME=$DB_USER"
    echo "DB_PASSWORD=$DB_PASSWORD"
else
    print_error "❌ Database setup failed!"
    exit 1
fi

# Test connection
print_step "Testing database connection..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" "$DB_NAME" -e "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_status "✅ Database connection test successful!"
else
    print_error "❌ Database connection test failed!"
    exit 1
fi