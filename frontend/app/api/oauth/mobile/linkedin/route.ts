import { NextRequest, NextResponse } from 'next/server';

// LinkedIn only accepts https redirect URIs, so the mobile app registers this
// page and we bounce the authorization result back into the app. The app
// exchanges the code itself via `/api/Auth/linkedin-verify`.
const APP_CALLBACK = 'vocare://oauth/linkedin';
const FORWARDED_PARAMS = ['code', 'state', 'error', 'error_description'] as const;

export function GET(request: NextRequest) {
  const target = new URL(APP_CALLBACK);
  for (const key of FORWARDED_PARAMS) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  return NextResponse.redirect(target.toString());
}
