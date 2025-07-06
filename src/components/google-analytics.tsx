'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { logEvent } from 'firebase/analytics';
import { analytics } from '@/lib/firebase';

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!analytics) {
      return;
    }
    const url = pathname + searchParams.toString();
    logEvent(analytics, 'page_view', {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
}
