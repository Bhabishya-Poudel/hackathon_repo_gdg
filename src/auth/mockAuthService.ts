import { AuthError, type AuthService, type User } from './types';

/**
 * Browser-only demonstration authentication with localStorage persistence.
 * Passwords use per-account salts and PBKDF2-SHA256 hashes (150,000 iterations).
 * Client-side verification does not provide server-enforced access control.
 */

const USERS_KEY = 'civictext.mock.users.v2';
const SESSION_KEY = 'civictext.mock.session';
const LATENCY_MS = 300;
const PBKDF2_ITERATIONS = 150_000;

interface StoredUser extends User {
  salt: string;
  hash: string;
}

const DEMO_ACCOUNT = {
  name: 'Amara Johnson',
  email: 'demo@civictext.org',
  password: 'password123',
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const toHex = (bytes: ArrayBuffer | Uint8Array) =>
  Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const fromHex = (hex: string) =>
  new Uint8Array(hex.match(/.{2}/g)?.map((h) => parseInt(h, 16)) ?? []);

function randomSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

async function hashPassword(password: string, saltHex: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: fromHex(saltHex),
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    256,
  );
  return toHex(bits);
}

/** Compares two hex strings without short-circuiting on the first mismatch. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw) as StoredUser[];
  } catch {
    /* storage unavailable */
  }
  return [];
}

function writeUsers(users: StoredUser[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* storage unavailable */
  }
}

let demoSeeded: Promise<void> | null = null;

function ensureDemoAccount(): Promise<void> {
  if (!demoSeeded) {
    demoSeeded = (async () => {
      const users = readUsers();
      if (users.some((u) => u.email === DEMO_ACCOUNT.email)) return;
      const salt = randomSalt();
      users.push({
        id: 'demo',
        name: DEMO_ACCOUNT.name,
        email: DEMO_ACCOUNT.email,
        createdAt: new Date(0).toISOString(),
        salt,
        hash: await hashPassword(DEMO_ACCOUNT.password, salt),
      });
      writeUsers(users);
    })();
  }
  return demoSeeded;
}

function toPublic(stored: StoredUser): User {
  const { id, name, email, createdAt } = stored;
  return { id, name, email, createdAt };
}

function saveSession(user: User, remember: boolean) {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    const store = remember ? localStorage : sessionStorage;
    store.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable */
  }
}

export const mockAuthService: AuthService = {
  async getSession() {
    await ensureDemoAccount();
    try {
      const raw =
        sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },

  async signIn({ email, password, remember = false }) {
    await Promise.all([wait(LATENCY_MS), ensureDemoAccount()]);
    const user = readUsers().find(
      (u) => u.email === email.trim().toLowerCase(),
    );
    // Hash even when the user is missing so timing does not reveal
    // which emails exist.
    const candidate = await hashPassword(password, user?.salt ?? randomSalt());
    if (!user || !constantTimeEqual(candidate, user.hash)) {
      throw new AuthError(
        'invalid-credentials',
        'That email and password combination did not match.',
      );
    }
    const publicUser = toPublic(user);
    saveSession(publicUser, remember);
    return publicUser;
  },

  async signUp({ name, email, password }) {
    await Promise.all([wait(LATENCY_MS), ensureDemoAccount()]);
    const users = readUsers();
    const normalized = email.trim().toLowerCase();
    if (users.some((u) => u.email === normalized)) {
      throw new AuthError(
        'email-in-use',
        'An account with this email already exists. Try signing in instead.',
      );
    }
    const salt = randomSalt();
    const user: StoredUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalized,
      createdAt: new Date().toISOString(),
      salt,
      hash: await hashPassword(password, salt),
    };
    users.push(user);
    writeUsers(users);
    const publicUser = toPublic(user);
    saveSession(publicUser, true);
    return publicUser;
  },

  async signOut() {
    await wait(200);
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* storage unavailable */
    }
  },

  async requestPasswordReset() {
    await Promise.all([wait(LATENCY_MS), ensureDemoAccount()]);
    // Always succeed so the form cannot be used to probe which emails exist.
  },
};

export const demoCredentials = {
  email: DEMO_ACCOUNT.email,
  password: DEMO_ACCOUNT.password,
};
