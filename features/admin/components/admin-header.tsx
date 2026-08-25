import Link from 'next/link';
import { ExternalLink, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '../auth-actions';

/** Chrome shared by every signed-in admin page. */
export function AdminHeader() {
  return (
    <header className="border-border bg-card sticky top-0 z-10 border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link href="/admin" className="text-sm font-semibold tracking-tight">
          Voltage Reef studio
        </Link>
        <div className="flex-1" />
        <Button asChild variant="ghost" size="sm">
          <Link href="/store" target="_blank" rel="noreferrer">
            <ExternalLink />
            <span className="hidden sm:inline">View store</span>
          </Link>
        </Button>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
