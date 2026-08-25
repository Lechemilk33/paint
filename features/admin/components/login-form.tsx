'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn, type SignInState } from '../auth-actions';

const INITIAL: SignInState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Checking...' : 'Sign in'}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          aria-describedby={state.error ? 'password-error' : undefined}
          aria-invalid={state.error ? true : undefined}
        />
        {state.error ? (
          <p id="password-error" role="alert" className="text-destructive text-sm">
            {state.error}
          </p>
        ) : null}
      </div>
      <SubmitButton />
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <LockKeyhole className="size-3" />
        Studio access only
      </p>
    </form>
  );
}
