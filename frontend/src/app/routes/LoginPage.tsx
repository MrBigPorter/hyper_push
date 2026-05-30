// ==========================================
// HyperPush — Login Page
// ==========================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import { authStart, authSuccess, authFailure } from '@app/store/slices/authSlice';
import { useMutation } from '@apollo/client/react';
import { LOGIN_MUTATION } from '@app/lib/graphql';
import { Input, Button, Card } from '@app/components/ui';
import type { AuthResponseData } from '@app/types/graphql';

// Zod validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Please enter your email')
    .email('Invalid email format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [loginMutation] = useMutation(LOGIN_MUTATION);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    dispatch(authStart());

    try {
      const result = await loginMutation({
        variables: {
          input: {
            email: data.email,
            password: data.password,
          },
        },
      }) as { data?: AuthResponseData };

      const { accessToken, user } = result.data?.login ?? {};

      if (!accessToken || !user) {
        throw new Error('Invalid response from server');
      }

      dispatch(authSuccess({ token: accessToken, user }));
      navigate({ to: '/dashboard' });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Login failed, please try again';
      dispatch(authFailure(message));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-dark-950">
      <Card padding="lg" className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <img
            src="/logo.png"
            alt="HyperPush"
            className="mx-auto mb-4 h-16 w-16"
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            HyperPush
          </h1>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="admin@example.com"
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            autoComplete="current-password"
            {...register('password')}
          />

          <Button
            type="submit"
            loading={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
}
