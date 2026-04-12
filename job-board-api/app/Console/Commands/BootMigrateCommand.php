<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;

class BootMigrateCommand extends Command
{
    private const LOCK_NAMESPACE = 'jobix';
    private const LOCK_RESOURCE = 'boot-migrate';

    protected $signature = 'app:boot-migrate {--database= : The database connection to use}';

    protected $description = 'Run boot-time migrations with a Postgres advisory lock';

    public function handle(): int
    {
        $database = $this->option('database');
        $connection = DB::connection($database);

        if ($connection->getDriverName() !== 'pgsql') {
            return $this->runMigrations($database);
        }

        $lockConnection = $this->makeLockConnection($connection->getConfig());
        $lockKeys = [
            $this->lockKey(self::LOCK_NAMESPACE),
            $this->lockKey(self::LOCK_RESOURCE),
        ];

        $this->components->info('Waiting for Postgres migration lock...');
        $lockConnection->prepare('select pg_advisory_lock(?, ?)')->execute($lockKeys);

        try {
            $this->components->info('Postgres migration lock acquired.');

            return $this->runMigrations($database);
        } finally {
            $lockConnection->prepare('select pg_advisory_unlock(?, ?)')->execute($lockKeys);
        }
    }

    private function runMigrations(?string $database): int
    {
        $options = ['--force' => true];

        if ($database) {
            $options['--database'] = $database;
        }

        return $this->call('migrate', $options);
    }

    /**
     * Use a dedicated Postgres session so the advisory lock remains held while
     * Laravel opens other connections during migration execution.
     */
    private function makeLockConnection(array $config): PDO
    {
        $dsn = collect([
            'host' => $config['host'] ?? null,
            'port' => $config['port'] ?? null,
            'dbname' => $config['database'] ?? null,
            'sslmode' => $config['sslmode'] ?? null,
        ])->filter(static fn ($value) => filled($value))
            ->map(static fn ($value, $key) => sprintf('%s=%s', $key, $value))
            ->implode(';');

        $pdo = new PDO(
            sprintf('pgsql:%s', $dsn),
            $config['username'] ?? '',
            $config['password'] ?? '',
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

        return $pdo;
    }

    private function lockKey(string $value): int
    {
        $hash = crc32($value);

        return $hash > 0x7FFFFFFF ? $hash - 0x100000000 : $hash;
    }
}
