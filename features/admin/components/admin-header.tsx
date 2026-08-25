import Link from 'next/link';
import { ExternalLink, Inbox, LogOut, Palette, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listEnquiries } from '@/lib/enquiries/repository';
import { countUnread } from '@/lib/enquiries/schema';
import { signOut } from '../auth-actions';

/**
 * Chrome shared by every signed-in admin page.
 *
 * Async because it carries the unread count: an inbox badge that only appears
 * once you visit the inbox is useless, so the number is read on every admin
 * page. The pages that render it are already dynamic, so this costs one blob
 * read and never a stale count.
 */
export async function AdminHeader() {
  const unread = countUnread(await listEnquiries());

  return (
    <header className="border-border bg-card sticky top-0 z-10 border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4 sm:gap-2 sm:px-6">
        <Link href="/admin" className="mr-1 text-sm font-semibold tracking-tight sm:mr-2">
          <span className="hidden sm:inline">Voltage Reef studio</span>
          <span className="sm:hidden">Studio</span>
        </Link>

        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">
            <Palette />
            <span className="hidden sm:inline">Paintings</span>
          </Link>
        </Button>

        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/enquiries">
            <Inbox />
            <span className="hidden sm:inline">Enquiries</span>
            {unread > 0 ? (
              <span className="bg-primary text-primary-foreground ml-0.5 rounded-full px-1.5 py-0.5 text-[0.6875rem] leading-none font-semibold tabular-nums">
                {unread}
              </span>
            ) : null}
            {unread > 0 ? (
              <span className="sr-only">
                {unread === 1 ? '1 unread enquiry' : `${unread} unread enquiries`}
              </span>
            ) : null}
          </Link>
        </Button>

        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/studio">
            <Settings />
            <span className="hidden sm:inline">Studio</span>
          </Link>
        </Button>

        <div className="flex-1" />

        <Button asChild variant="ghost" size="sm">
          <Link href="/store" target="_blank" rel="noreferrer">
            <ExternalLink />
            <span className="hidden md:inline">View store</span>
          </Link>
        </Button>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut />
            <span className="hidden md:inline">Sign out</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
