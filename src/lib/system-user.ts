export const SYSTEM_USER_ID = 'system-public-user';
export const SYSTEM_CLIENT_TOKEN = 'system-public-token';

export const SYSTEM_USER = {
  id: SYSTEM_USER_ID,
  username: 'system',
  role: 'user' as const,
};

export function getSystemToken(): string {
  return SYSTEM_CLIENT_TOKEN;
}
