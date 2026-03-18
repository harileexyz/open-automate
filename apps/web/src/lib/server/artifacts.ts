import { adminStorage } from '@/lib/firebase/admin';

const ARTIFACT_URL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function resolveBucket() {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not configured');
    }
    return adminStorage.bucket(bucketName);
}

export async function createSignedArtifactUrl(options: {
    path: string;
    downloadName?: string;
    asAttachment?: boolean;
}) {
    const bucket = resolveBucket();
    const file = bucket.file(options.path);
    const [exists] = await file.exists();

    if (!exists) {
        throw new Error(`Artifact not found: ${options.path}`);
    }

    const [url] = await file.getSignedUrl({
        action: 'read',
        version: 'v4',
        expires: Date.now() + ARTIFACT_URL_TTL_MS,
        responseDisposition: options.downloadName
            ? `${options.asAttachment ? 'attachment' : 'inline'}; filename="${options.downloadName}"`
            : undefined,
    });

    return url;
}

export async function resolveArtifactUrl(options: {
    path?: string | null;
    source?: string | null;
    downloadName?: string;
    asAttachment?: boolean;
}) {
    if (options.path) {
        return createSignedArtifactUrl({
            path: options.path,
            downloadName: options.downloadName,
            asAttachment: options.asAttachment,
        });
    }

    if (options.source) {
        return options.source;
    }

    throw new Error('Artifact path or source URL is required');
}
