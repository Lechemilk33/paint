import Link from 'next/link';
import { ExternalLink, Inbox, LogOut, Package, Palette, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listInquiries } from '@/lib/inquiries/repository';
import { countUnread } from '@/lib/inquiries/schema';
import { listOrders } from '@/lib/orders/repository';
import { countOpen } from '@/lib/orders/schema';
import { signOut } from '../auth-actions';

/**
 * Chrome shared by every signed-in admin page.
 *
 * Async because it carries the unread and unshipped counts: a badge that only
 * appears once you visit the page it counts is useless, so both numbers are
 * read on every admin page. The pages that render it are already dynamic, so
 * this costs two blob reads and never a stale count.
 */
export async function AdminHeader() {
  const [inquiries, orders] = await Promise.all([listInquiries(), listOrders()]);
  const unread = countUnread(inquiries);
  const open = countOpen(orders);

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
          <Link href="/admin/inquiries">
            <Inbox />
            <span className="hidden sm:inline">Inquiries</span>
            {unread > 0 ? (
              <span className="bg-primary text-primary-foreground ml-0.5 rounded-full px-1.5 py-0.5 text-[0.6875rem] leading-none font-semibold tabular-nums">
                {unread}
              </span>
            ) : null}
            {unread > 0 ? (
              <span className="sr-only">
                {unread === 1 ? '1 unread inquiry' : `${unread} unread inquiries`}
              </span>
            ) : null}
          </Link>
        </Button>

        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/orders">
            <Package />
            <span className="hidden sm:inline">Orders</span>
            {open > 0 ? (
              <span className="bg-primary text-primary-foreground ml-0.5 rounded-full px-1.5 py-0.5 text-[0.6875rem] leading-none font-semibold tabular-nums">
                {open}
              </span>
            ) : null}
            {open > 0 ? (
              <span className="sr-only">
                {open === 1 ? '1 order needing attention' : `${open} orders needing attention`}
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
