'use client';

import { AuthProvider } from '@/lib/firebase';

export function Providers({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
}
