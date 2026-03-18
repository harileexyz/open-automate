const REQUIRED_SERVER_ENV = [
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'FIREBASE_SERVICE_ACCOUNT_KEY',
] as const;

export function getMissingServerEnv() {
    return REQUIRED_SERVER_ENV.filter((key) => !process.env[key]);
}

export function getServerEnvStatus() {
    const missing = getMissingServerEnv();

    return {
        ok: missing.length === 0,
        missing,
    };
}

export function assertServerEnv(context: string) {
    const status = getServerEnvStatus();

    if (!status.ok) {
        throw new Error(`${context} missing required env vars: ${status.missing.join(', ')}`);
    }
}
