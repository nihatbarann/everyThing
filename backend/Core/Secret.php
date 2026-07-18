<?php

/**
 * Resolves the JWT signing secret.
 *
 * Order of precedence:
 *   1. JWT_SECRET environment variable (recommended for production —
 *      set it in Apache's SetEnv or your process manager).
 *   2. A previously auto-generated secret stored in config/jwt_secret.php
 *      (gitignored — never committed, unique per installation).
 *   3. If neither exists yet, generate a new cryptographically random
 *      secret and persist it for next time.
 *
 * There is deliberately no hardcoded fallback string: a shared default
 * secret baked into the source would let anyone who has read the (public)
 * source code forge valid tokens against any install that skipped setting
 * JWT_SECRET.
 */
class Secret {
    public static function jwt() {
        $envSecret = getenv('JWT_SECRET');
        if ($envSecret && strlen($envSecret) >= 32) {
            return $envSecret;
        }

        $file = __DIR__ . '/../config/jwt_secret.php';
        if (file_exists($file)) {
            $stored = require $file;
            if (is_string($stored) && strlen($stored) >= 32) {
                return $stored;
            }
        }

        $generated = bin2hex(random_bytes(32));
        $configDir = dirname($file);
        if (!is_dir($configDir)) {
            mkdir($configDir, 0777, true);
        }
        file_put_contents($file, "<?php\n// Auto-generated on first run. Do not commit — see .gitignore.\nreturn " . var_export($generated, true) . ";\n");

        return $generated;
    }
}
