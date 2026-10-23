'use client';

import { useEffect } from 'react';
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_MAX_AGE_SECONDS,
  buildAttribution,
  serializeAttribution,
} from '@/lib/attribution';

/** Saves first-touch UTM/referrer/landing data once; never overwrites it. */
export function AttributionCapture() {
  useEffect(() => {
    try {
      if (document.cookie.split(';').some((c) => c.trim().startsWith(`${ATTRIBUTION_COOKIE}=`))) return;
      const value = serializeAttribution(buildAttribution(new URL(window.location.href), document.referrer));
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${ATTRIBUTION_COOKIE}=${value}; Max-Age=${ATTRIBUTION_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
    } catch {
      // attribution is best-effort
    }
  }, []);
  return null;
}
