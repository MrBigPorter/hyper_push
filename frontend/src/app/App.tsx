import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { RecaptchaProvider } from './components/RecaptchaProvider';
import './globals.css';

export function App() {
  return (
    <RecaptchaProvider>
      <RouterProvider router={router} />
    </RecaptchaProvider>
  );
}
