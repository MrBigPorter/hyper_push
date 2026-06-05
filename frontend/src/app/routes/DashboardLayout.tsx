// ==========================================
// HyperPush — Dashboard Layout (with Sidebar + Header)
// ==========================================

import { Header } from '@app/components/Header';
import { Sidebar } from '@app/components/Sidebar';
import { useAppSelector } from '@app/hooks';
import { Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export function DashboardLayout() {
  const navigate = useNavigate();
  const { token, isLoaded } = useAppSelector((state) => state.auth);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLoaded && !token) {
      navigate({ to: '/' });
    }
  }, [isLoaded, token, navigate]);

  // Wait for auth state to load
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-dark-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-dark-950">
      <Sidebar />
      <div className="flex flex-1 flex-col h-screen">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
