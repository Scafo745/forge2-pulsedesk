FROM php:8.4-cli-alpine

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    bash \
    git \
    curl \
    libxml2-dev \
    oniguruma-dev \
    sqlite-dev \
    && docker-php-ext-install pdo pdo_mysql pdo_sqlite mbstring xml ctype

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy codebase
COPY . .

# Copy environment example to default environment file
RUN cp .env.example .env

# Strip DB prefix env variables to ensure they resolve from the system environment
RUN sed -i '/^DB_/d' .env

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Generate security key
RUN php artisan key:generate

# Expose container port
EXPOSE 8000

CMD php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=8000
