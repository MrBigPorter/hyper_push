// ==========================================
// HyperPush — Settings Page
// Profile + 2FA + Password Change
// ==========================================

import { useMutation, useQuery } from '@apollo/client/react';
import { Button } from '@app/components/ui/Button';
import { Card } from '@app/components/ui/Card';
import { useAppDispatch, useAppSelector } from '@app/hooks';
import {
  CHANGE_PASSWORD_MUTATION,
  DISABLE_2FA_MUTATION,
  ENABLE_2FA_MUTATION,
  ME_QUERY,
  SETUP_2FA_MUTATION,
  UPDATE_USER_MUTATION,
} from '@app/lib/graphql';
import { setUser } from '@app/store/slices/authSlice';
import type {
  ChangePasswordResponseData,
  Disable2faResponseData,
  Enable2faResponseData,
  MeResponseData,
  Setup2faResponseData,
  UpdateUserResponseData,
} from '@app/types/graphql';
import { Badge } from '@/components/ui/badge';
import { Check, KeyRound, Save, Shield, Smartphone, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface TotpSetupFormData {
  totpCode: string;
}

export function SettingsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const [profileSaved, setProfileSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 2FA state
  const [setupUri, setSetupUri] = useState<string | null>(null);
  const [isSettingUp2fa, setIsSettingUp2fa] = useState(false);
  const [isEnabling2fa, setIsEnabling2fa] = useState(false);
  const [isDisabling2fa, setIsDisabling2fa] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [totpSuccess, setTotpSuccess] = useState<string | null>(null);

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [updateUser] = useMutation(UPDATE_USER_MUTATION);
  const [setup2fa] = useMutation(SETUP_2FA_MUTATION);
  const [enable2fa] = useMutation(ENABLE_2FA_MUTATION);
  const [disable2fa] = useMutation(DISABLE_2FA_MUTATION);
  const [changePassword] = useMutation(CHANGE_PASSWORD_MUTATION);

  // Fetch current user data from server (refresh-safe)
  const { data: meData } = useQuery(ME_QUERY, {
    skip: !!user,
  });

  // When me query returns, update Redux store with user data
  useEffect(() => {
    const me = (meData as MeResponseData | undefined)?.me;
    if (me && !user) {
      dispatch(setUser(me));
    }
  }, [meData, user, dispatch]);

  const { register, handleSubmit, reset } = useForm<ProfileFormData>();

  // Populate form when user data is available from Redux store
  useEffect(() => {
    if (user) {
      reset({
        name: user.name ?? '',
        email: user.email ?? '',
      });
    }
  }, [user, reset]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const result = await updateUser({
        variables: { input: { id: user.id, name: data.name } },
      });
      const updatedUser = (result.data as UpdateUserResponseData)?.updateUser;
      if (updatedUser) {
        dispatch(setUser(updatedUser));
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ========================
  //  2FA Handlers
  // ========================

  const handleSetup2fa = async () => {
    setIsSettingUp2fa(true);
    setTotpError(null);
    try {
      const result = await setup2fa() as { data?: Setup2faResponseData };
      const uri = result.data?.setup2fa ?? null;
      if (uri) {
        setSetupUri(uri);
      } else {
        setTotpError('Failed to generate 2FA secret');
      }
    } catch (err) {
      setTotpError(err instanceof Error ? err.message : 'Failed to setup 2FA');
    } finally {
      setIsSettingUp2fa(false);
    }
  };

  const handleEnable2fa = async (code: string) => {
    if (!user) return;
    setIsEnabling2fa(true);
    setTotpError(null);
    try {
      await enable2fa({ variables: { token: code } }) as { data?: Enable2faResponseData };
      setTotpSuccess('2FA has been enabled successfully');
      setSetupUri(null);
      // Refresh user data to reflect totpEnabled = true
      const refreshed = await updateUser({
        variables: { input: { id: user.id, name: user.name } },
      });
      const updatedUser = (refreshed.data as UpdateUserResponseData)?.updateUser;
      if (updatedUser) {
        dispatch(setUser({ ...updatedUser, totpEnabled: true }));
      }
    } catch (err) {
      setTotpError(err instanceof Error ? err.message : 'Failed to enable 2FA');
    } finally {
      setIsEnabling2fa(false);
    }
  };

  const handleDisable2fa = async () => {
    if (!user) return;
    const password = window.prompt('Enter your password to disable 2FA:');
    if (!password) return;

    setIsDisabling2fa(true);
    setTotpError(null);
    try {
      await disable2fa({ variables: { password } }) as { data?: Disable2faResponseData };
      setTotpSuccess('2FA has been disabled');
      // Refresh user data
      const refreshed = await updateUser({
        variables: { input: { id: user.id, name: user.name } },
      });
      const updatedUser = (refreshed.data as UpdateUserResponseData)?.updateUser;
      if (updatedUser) {
        dispatch(setUser({ ...updatedUser, totpEnabled: false }));
      }
    } catch (err) {
      setTotpError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setIsDisabling2fa(false);
    }
  };

  // ========================
  //  Password Change Handler
  // ========================

  const passwordForm = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmitPasswordChange = async (data: PasswordFormData) => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (data.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        variables: {
          input: {
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          },
        },
      }) as { data?: ChangePasswordResponseData };
      setPasswordSuccess(true);
      passwordForm.reset();
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your profile, security, and password
        </p>
      </div>

      {/* ===== Profile Section ===== */}
      <Card padding="lg">
        <div className="flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-dark-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/20">
            <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your personal information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onProfileSubmit)} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="profile-name"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Name
              </label>
              <input
                id="profile-name"
                placeholder="Your name"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
                {...register('name')}
              />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                placeholder="you@example.com"
                disabled
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                {...register('email')}
              />
              <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
            </div>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </span>
            <Badge variant="secondary">{user?.role ?? 'developer'}</Badge>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={profileSaved || isSaving}
              loading={isSaving}
            >
              {profileSaved ? (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="mr-1 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* ===== Two-Factor Authentication Section ===== */}
      <Card padding="lg">
        <div className="flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-dark-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Two-Factor Authentication
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add an extra layer of security using Google Authenticator
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
            {user?.totpEnabled ? (
              <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Smartphone className="mr-1 h-3 w-3" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary">Disabled</Badge>
            )}
          </div>

          {/* Error / Success messages */}
          {totpError && (
            <div
              className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
              role="alert"
            >
              {totpError}
            </div>
          )}
          {totpSuccess && (
            <div
              className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400"
              role="alert"
            >
              {totpSuccess}
            </div>
          )}

          {/* 2FA Setup: Show QR Code */}
          {setupUri && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-600 dark:bg-dark-800">
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
              </p>
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupUri)}`}
                  alt="TOTP QR Code"
                  className="rounded-lg"
                  width={200}
                  height={200}
                />
              </div>
              <p className="mt-3 text-center text-xs text-gray-400">
                After scanning, enter the 6-digit code below to verify
              </p>

              {/* Verify TOTP Code */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const code = formData.get('totpVerifyCode') as string;
                  if (code) handleEnable2fa(code);
                }}
                className="mt-4 flex items-end gap-2"
              >
                <div className="flex-1">
                  <label
                    htmlFor="totpVerifyCode"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Verification Code
                  </label>
                  <input
                    id="totpVerifyCode"
                    name="totpVerifyCode"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
                  />
                </div>
                <Button type="submit" variant="primary" loading={isEnabling2fa}>
                  {isEnabling2fa ? 'Verifying...' : 'Verify & Enable'}
                </Button>
              </form>

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => setSetupUri(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!setupUri && (
            <div className="flex gap-3">
              {!user?.totpEnabled ? (
                <Button
                  variant="primary"
                  onClick={handleSetup2fa}
                  loading={isSettingUp2fa}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  {isSettingUp2fa ? 'Setting up...' : 'Setup 2FA'}
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={handleDisable2fa}
                  loading={isDisabling2fa}
                >
                  {isDisabling2fa ? 'Disabling...' : 'Disable 2FA'}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ===== Password Change Section ===== */}
      <Card padding="lg">
        <div className="flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-dark-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
            <KeyRound className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Change Password</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.totpEnabled
                ? 'You will need your authenticator app if 2FA is enabled'
                : 'Update your account password'}
            </p>
          </div>
        </div>

        <form
          onSubmit={passwordForm.handleSubmit(onSubmitPasswordChange)}
          className="mt-6 space-y-4"
        >
          {passwordError && (
            <div
              className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
              role="alert"
            >
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div
              className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400"
              role="alert"
            >
              Password changed successfully
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="current-password"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                placeholder="••••••••"
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
                {...passwordForm.register('currentPassword')}
              />
            </div>
            <div>
              <label
                htmlFor="new-password"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                placeholder="Min. 8 characters"
                required
                minLength={8}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
                {...passwordForm.register('newPassword')}
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Repeat new password"
                required
                minLength={8}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-800 dark:text-gray-100"
                {...passwordForm.register('confirmPassword')}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={isChangingPassword}
              disabled={passwordSuccess}
            >
              {isChangingPassword ? (
                'Changing...'
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
