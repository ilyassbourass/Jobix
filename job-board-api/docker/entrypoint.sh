#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS_ON_BOOT:-true}" = "true" ]; then
    php artisan app:boot-migrate
fi

if [ "${RUN_SEEDERS_ON_BOOT:-false}" = "true" ]; then
    php artisan db:seed --force
fi

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
