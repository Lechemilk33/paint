import type { Metadata } from 'next';
import { LoginForm } from '@/features/admin/components/login-form';

export const metadata: Metadata = {
  title: 'Sign in — Voltage Reef studio',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="bg-background text-foreground grid min-h-svh place-items-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Studio</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to manage the paintings.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
