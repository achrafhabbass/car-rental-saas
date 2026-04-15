'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/// /platform/dashboard is the canonical URL requested in the spec. The
/// implementation lives at /platform (the metrics + sweep page) so we keep
/// that single source of truth and redirect.
export default function PlatformDashboardAliasPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/platform');
  }, [router]);
  return null;
}
