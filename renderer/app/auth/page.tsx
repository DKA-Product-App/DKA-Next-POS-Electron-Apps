'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Auth() {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (pathname) {
            router.replace(`${pathname}/login`);
        }
    }, [pathname, router]);

    return null; // kosong, karena langsung redirect
}
