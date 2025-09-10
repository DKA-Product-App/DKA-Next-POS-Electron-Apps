'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminMainPage() {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (pathname) {
            router.replace(`${pathname}/overview`);
            console.log(`move to ${pathname}/overview`)
        }
    }, [pathname, router]);

    return null; // kosong, karena langsung redirect
}