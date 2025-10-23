#!/bin/bash

echo "================================"
echo "Environment Configuration Helper"
echo "================================"
echo

# Database Configuration
read -p "Enter Database Host (default: 127.0.0.1): " DB_HOST
DB_HOST=${DB_HOST:-127.0.0.1}

read -p "Enter Database Port (default: 3306): " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "Enter Database Name: " DB_NAME
if [ -z "$DB_NAME" ]; then
    echo "Database name is required!"
    exit 1
fi

read -p "Enter Database Username: " DB_USER
if [ -z "$DB_USER" ]; then
    echo "Database username is required!"
    exit 1
fi

read -s -p "Enter Database Password: " DB_PASS
echo

# Mail Configuration
read -p "Enter SMTP Host (optional): " MAIL_HOST
read -p "Enter SMTP Port (default: 587): " MAIL_PORT
MAIL_PORT=${MAIL_PORT:-587}

read -p "Enter SMTP Username (optional): " MAIL_USER
read -s -p "Enter SMTP Password (optional): " MAIL_PASS
echo

read -p "Enter From Email Address (optional): " MAIL_FROM
read -p "Enter Application Name (default: Event Registration System): " APP_NAME
APP_NAME=${APP_NAME:-"Event Registration System"}

echo
echo "Updating backend environment file..."

cd backend

# Backup existing .env if it exists
if [ -f .env ]; then
    cp .env .env.backup
    echo "Existing .env backed up to .env.backup"
fi

# Copy from example
cp .env.example .env

# Update database configuration
sed -i "s/DB_HOST=.*/DB_HOST=$DB_HOST/" .env
sed -i "s/DB_PORT=.*/DB_PORT=$DB_PORT/" .env
sed -i "s/DB_DATABASE=.*/DB_DATABASE=$DB_NAME/" .env
sed -i "s/DB_USERNAME=.*/DB_USERNAME=$DB_USER/" .env
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" .env

# Update application name
sed -i "s/APP_NAME=.*/APP_NAME=\"$APP_NAME\"/" .env

# Update mail configuration if provided
if [ ! -z "$MAIL_HOST" ]; then
    sed -i "s/MAIL_HOST=.*/MAIL_HOST=$MAIL_HOST/" .env
fi
if [ ! -z "$MAIL_PORT" ]; then
    sed -i "s/MAIL_PORT=.*/MAIL_PORT=$MAIL_PORT/" .env
fi
if [ ! -z "$MAIL_USER" ]; then
    sed -i "s/MAIL_USERNAME=.*/MAIL_USERNAME=$MAIL_USER/" .env
fi
if [ ! -z "$MAIL_PASS" ]; then
    sed -i "s/MAIL_PASSWORD=.*/MAIL_PASSWORD=$MAIL_PASS/" .env
fi
if [ ! -z "$MAIL_FROM" ]; then
    sed -i "s/MAIL_FROM_ADDRESS=.*/MAIL_FROM_ADDRESS=\"$MAIL_FROM\"/" .env
fi

echo "Generating application key..."
php artisan key:generate

echo
echo "Updating frontend environment file..."
cd ../frontend

# Backup existing .env.local if it exists
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo "Existing .env.local backed up to .env.local.backup"
fi

# Copy from example
cp .env.example .env.local

echo
echo "================================"
echo "Configuration Complete!"
echo "================================"
echo
echo "Database Configuration:"
echo "- Host: $DB_HOST"
echo "- Port: $DB_PORT"
echo "- Database: $DB_NAME"
echo "- Username: $DB_USER"
echo
echo "Next Steps:"
echo "1. Make sure your database server is running"
echo "2. Create the database '$DB_NAME' if it doesn't exist"
echo "3. Run: php artisan migrate (in backend folder)"
echo "4. Run: php artisan db:seed (optional - for sample data)"
echo