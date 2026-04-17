import env from '@/lib/env/server';

import { cookies } from 'next/headers';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const res = await fetch(`${env.API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) throw new Error(`API Error. Status: ${res.status}: ${res.statusText}`);
}
