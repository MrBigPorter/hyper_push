// ==========================================
// HyperPush — Login Page
// Supports TOTP 2FA second step
// ==========================================

import { useMutation } from '@apollo/client/react';
import { Button, Card, Input } from '@app/components/ui';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { LOGIN_MUTATION, VERIFY_2FA_MUTATION } from '@app/lib/graphql';
import { authFailure, authStart, authSuccess, setRequires2fa } from '@app/store/slices/authSlice';
import type { AuthResponseData, Verify2faResponseData } from '@app/types/graphql';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { KeyRound, Smartphone } from 'lucide-react';

// Zod validation schema for step 1 (email + password)
const loginSchema = z.object({
  email: z.string().min(1, 'Please enter your email').email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Zod validation schema for step 2 (TOTP code)
const totpSchema = z.object({
  totpCode: z.string().min(1, 'Please enter the authentication code').length(6, 'Code must be 6 digits'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type TotpFormData = z.infer<typeof totpSchema>;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, requires2fa, tempToken } = useAppSelector((state) => state.auth);

  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [verify2faMutation] = useMutation(VERIFY_2FA_MUTATION);

  // Step 1 form (email + password)
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Step 2 form (TOTP code)
  const totpForm = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: {
      totpCode: '',
    },
  });

  const onSubmitStep1 = async (data: LoginFormData) => {
    dispatch(authStart());

    try {
      const result = (await loginMutation({
        variables: {
          input: {
            email: data.email,
            password: data.password,
          },
        },
      })) as { data?: AuthResponseData };

      const response = result.data?.login;
      if (!response?.user) {
        throw new Error('Invalid response from server');
      }

      // Check if 2FA is required
      if (response.requires2fa && response.tempToken) {
        dispatch(setRequires2fa({ tempToken: response.tempToken, user: response.user }));
        // Focus the TOTP input
        setTimeout(() => totpForm.setFocus('totpCode'), 100);
        return;
      }

      // Normal login (no 2FA)
      if (!response.accessToken) {
        throw new Error('Invalid response from server');
      }

      dispatch(authSuccess({ token: response.accessToken, user: response.user }));
      navigate({ to: '/dashboard' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed, please try again';
      dispatch(authFailure(message));
    }
  };

  const onSubmitStep2 = async (data: TotpFormData) => {
    if (!tempToken) return;
    dispatch(authStart());

    try {
      const result = (await verify2faMutation({
        variables: {
          input: {
            token: data.totpCode,
            tempToken,
          },
        },
      })) as { data?: Verify2faResponseData };

      const response = result.data?.verify2fa;
      if (!response?.accessToken || !response?.user) {
        throw new Error('Invalid authentication code');
      }

      dispatch(authSuccess({ token: response.accessToken, user: response.user }));
      navigate({ to: '/dashboard' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed, please try again';
      dispatch(authFailure(message));
    }
  };

  const handleBackToLogin = () => {
    dispatch(authFailure(null as unknown as string));
    // Reset to step 1
    dispatch({ type: 'auth/setRequires2fa', payload: { tempToken: null, user: null } });
    window.location.reload();
  };

  // ─── Step 1: Email + Password ─────────────────────
  if (!requires2fa) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-dark-950">
        <Card padding="lg" className="w-full max-w-md">
          {/* Logo / Header */}
          <div className="mb-8 text-center">
            <img src="/logo.png" alt="HyperPush" className="mx-auto mb-4 h-16 w-16" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">HyperPush</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              CodePush Universal Management Console
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={loginForm.handleSubmit(onSubmitStep1)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@example.com"
              error={loginForm.formState.errors.email?.message}
              autoComplete="email"
              {...loginForm.register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={loginForm.formState.errors.password?.message}
              autoComplete="current-password"
              {...loginForm.register('password')}
            />

            <Button type="submit" loading={isLoading} className="w-full" size="lg">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">
              Register
            </Link>
          </p>
        </Card>
      </div>
    );
  }

  // ─── Step 2: TOTP Verification ───────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-dark-950">
      <Card padding="lg" className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20">
            <Smartphone className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Two-Factor Authentication</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* TOTP Form */}
        <form onSubmit={totpForm.handleSubmit(onSubmitStep2)} className="space-y-4">
          <Input
            label="Authentication Code"
            type="text"
            inputMode="numeric"
            placeholder="000000"
            maxLength={6}
            error={totpForm.formState.errors.totpCode?.message}
            autoComplete="one-time-code"
            {...totpForm.register('totpCode')}
          />

          <Button type="submit" loading={isLoading} className="w-full" size="lg">
            {isLoading ? (
              'Verifying...'
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" />
                Verify & Sign In
              </>
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            ← Back to login
          </button>
        </p>
      </Card>
    </div>
  );
}
