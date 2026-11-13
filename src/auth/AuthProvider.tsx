import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext, type AuthStatus } from './authContext';
import type { AuthService, SignInInput, SignUpInput, User } from './types';

interface Props {
  service: AuthService;
  children: ReactNode;
}

export default function AuthProvider({ service, children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    service
      .getSession()
      .then((session) => {
        if (cancelled) return;
        setUser(session);
        setStatus(session ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        if (!cancelled) setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, [service]);

  const signIn = useCallback(
    async (input: SignInInput) => {
      const next = await service.signIn(input);
      setUser(next);
      setStatus('authenticated');
      return next;
    },
    [service],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const next = await service.signUp(input);
      setUser(next);
      setStatus('authenticated');
      return next;
    },
    [service],
  );

  const signOut = useCallback(async () => {
    await service.signOut();
    setUser(null);
    setStatus('anonymous');
  }, [service]);

  const requestPasswordReset = useCallback(
    (email: string) => service.requestPasswordReset(email),
    [service],
  );

  const value = useMemo(
    () => ({ user, status, signIn, signUp, signOut, requestPasswordReset }),
    [user, status, signIn, signUp, signOut, requestPasswordReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
