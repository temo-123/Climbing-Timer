import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { JSEncrypt } from 'jsencrypt';
import { getApiBaseUrl } from './api';

// climbing.ge (github.com/temo-123/climbing.ge, docs/AUTH.md) requires the
// /login password to be RSA-encrypted (PKCS#1 v1.5, matching openssl_private_decrypt's
// default padding) with this static public key — copied verbatim from the web
// frontend's resources/js/components/auth/LoginComponent.vue. Only the public
// half lives client-side; the matching private key never leaves the server.
// /register is unaffected — its password field is sent in the clear over HTTPS,
// matching the backend as built.
const LOGIN_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuydxIbJIeJhsmra7QKZa
eXo12J/17Q5Yah+K0hFP7BWvvnDZ1D3IZ0GvIh2PhZLvBc/wzXMK3gyH3qUCuqmh
rG9+4pg2OMFtD9fbNhFP2cIEL+B4qIFVh589JLBs6uduHHloofKElIzBlN7sxHfF
R1fNag6AbqDJfB/aXW0XpK8oABDblGO44/m64Kh6OpWvolxEfC+Mnhs+SXIdj3rn
R39id5+axL6sdWnXpW5uMRqy633JuKiGamvVkEk+BzzWqMMVoGLvKRJR67w52DG9
jfcB6GWPL237h6UE9vcCGfIdHOk9l3nErU5N9s8Q1taebwsMDgLe2FrOtM+FmkfH
2wIDAQAB
-----END PUBLIC KEY-----`;

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

export interface AuthUser {
  id: number;
  name: string;
  surname?: string;
  email: string;
  [key: string]: unknown;
}

export interface RegisterFields {
  name: string;
  surname: string;
  country: string;
  city: string;
  phone_number: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export function encryptPassword(password: string): string {
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(LOGIN_PUBLIC_KEY);
  const encrypted = encrypt.encrypt(password);
  if (!encrypted) throw new Error('Password encryption failed');
  return encrypted;
}

const client = axios.create({ timeout: 15000 });

client.interceptors.request.use(async config => {
  config.baseURL = await getApiBaseUrl();
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Mirrors the web app's own 401 interceptor (docs/AUTH.md): an expired/revoked
// token means the device drops back to local-only mode, not a hard error.
client.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) await clearSession();
    return Promise.reject(err);
  }
);

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function isLoggedIn(): Promise<boolean> {
  return (await getToken()) !== null;
}

async function storeSession(token: string, user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function register(fields: RegisterFields, lang: 'en' | 'ka', recaptchaToken?: string): Promise<AuthUser> {
  const { data } = await client.post('/register', {
    ...fields,
    lang: lang === 'ka' ? 'ka' : 'us', // backend's RegisterController validates lang as in:us,ka
    recaptcha_token: recaptchaToken,
  });
  await storeSession(data.token, data.user);
  return data.user;
}

export async function login(email: string, password: string, recaptchaToken?: string): Promise<AuthUser> {
  const { data } = await client.post('/login', {
    email,
    password: encryptPassword(password),
    remember: true,
    recaptcha_token: recaptchaToken,
  });
  await storeSession(data.token, data.user);
  return data.user;
}

// Best-effort: revokes the token server-side, but a logged-out local state is
// what matters most, so it always clears locally even if the request fails.
export async function logout(): Promise<void> {
  try {
    await client.post('/logout');
  } catch {
    // ignore — still clearing locally below
  }
  await clearSession();
}

// Used on app boot to validate/refresh a stored session. Returns null (and
// silently leaves the stored session alone) on network failure so a device
// that opens offline doesn't get logged out just because it can't reach the API.
export async function fetchAuthUser(): Promise<AuthUser | null> {
  if (!(await isLoggedIn())) return null;
  try {
    const { data } = await client.get('/auth_user');
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data));
    return data;
  } catch (err: any) {
    if (err?.response?.status === 401) return null; // already cleared by the interceptor
    return getStoredUser();
  }
}

export { client as authClient };
