import { HICHKI_PUBLIC_RUNTIME_CONFIG } from './public-runtime-config.mjs';

const supabaseUrl = String(process.env.SUPABASE_URL || process.env.HICHKI_SUPABASE_URL || HICHKI_PUBLIC_RUNTIME_CONFIG.supabaseUrl || '').replace(/\/$/, '');
const publishableKey = String(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.HICHKI_SUPABASE_ANON_KEY || HICHKI_PUBLIC_RUNTIME_CONFIG.supabasePublishableKey || '');

const users = [
  {
    email: process.env.E2E_EMAIL_A,
    password: process.env.E2E_PASSWORD_A,
    displayName: 'Hichki E2E A',
  },
  {
    email: process.env.E2E_EMAIL_B,
    password: process.env.E2E_PASSWORD_B,
    displayName: 'Hichki E2E B',
  },
];

if (!supabaseUrl || !publishableKey) {
  throw new Error('Missing Supabase URL or publishable key.');
}

for (const user of users) {
  if (!user.email || !user.password) {
    throw new Error('Missing E2E email/password environment variables.');
  }
}

for (const user of users) {
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      data: {
        display_name: user.displayName,
        e2e: true,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  const error = payload?.msg || payload?.message || payload?.error_description || null;
  console.log(
    'E2E_SIGNUP',
    user.displayName,
    `status=${response.status}`,
    `user=${payload?.user?.id || 'none'}`,
    `session=${payload?.access_token ? 'yes' : 'no'}`,
    `error=${error || 'none'}`,
  );

  if (!response.ok && response.status !== 422) {
    throw new Error(`Signup failed for ${user.displayName}: ${response.status} ${error || 'unknown'}`);
  }
}

console.log('E2E_AUTH_BOOTSTRAP_COMPLETE');
