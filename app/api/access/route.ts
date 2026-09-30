import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolvePaidAccess } from '@/lib/access';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const access = await resolvePaidAccess(req);
  return NextResponse.json({
    paid: access.paid,
    plan: access.plan,
    via: access.via,
    adultPlan: access.adultPlan,
    hasBilling: access.hasBilling,
  });
}
