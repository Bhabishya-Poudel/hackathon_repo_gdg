export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface SignInInput {
  email: string;
  password: string;
  remember?: boolean;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export type AuthErrorCode =
  | 'invalid-credentials'
  | 'email-in-use'
  | 'user-not-found'
  | 'weak-password'
  | 'network'
  | 'unknown';

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

/**
 * Authentication contract shared by account pages and session providers.
 */
export interface AuthService {
  getSession(): Promise<User | null>;
  signIn(input: SignInInput): Promise<User>;
  signUp(input: SignUpInput): Promise<User>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
}
