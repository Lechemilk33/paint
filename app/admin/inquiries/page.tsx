import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/features/admin/components/admin-header';
import { InquiryFilters } from '@/features/admin/components/inquiry-filters';
import { listInquiries } from '@/lib/inquiries/repository';
import {
  INQUIRY_KIND_LABEL,
  INQUIRY_STATUS_LABEL,
  inquiryKindSchema,
  inquiryStatusSchema,
  inquirySummary,
  filterInquiries,
  type InquiryStatus,
} from '@/lib/inquiries/schema';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Inquiries — Voltage Reef studio' };

/** New is the one that should catch the eye; archived should not. */
const STATUS_STYLE: Record<InquiryStatus, string> = {
  new: 'bg-primary text-primary-foreground',
  open: 'bg-warning-subtle text-warning',
  replied: 'bg-success-subtle text-success',
  archived: 'bg-muted text-muted-foreground',
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const all = await listInquiries();

  // Unrecognised query values fall back to "no filter" rather than an empty
  // list, so a hand-edited URL never looks like an empty inbox.
  const status = inquiryStatusSchema.safeParse(params.status);
  const kind = inquiryKindSchema.safeParse(params.kind);
  const visible = filterInquiries(all, {
    status: status.success ? status.data : null,
    kind: kind.success ? kind.data : null,
  });

  const unread = all.filter((inquiry) => inquiry.status === 'new').length;

  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Inquiries</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {all.length} total
            {unread > 0 ? ` · ${unread} unread` : ' · nothing unread'}
          </p>
        </div>

        <div className="mb-6">
          <InquiryFilters />
        </div>

        {visible.length === 0 ? (
          <div className="border-border rounded-lg border border-dashed p-12 text-center">
            <Inbox className="text-muted-foreground mx-auto size-6" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-medium">
              {all.length === 0 ? 'No inquiries yet' : 'Nothing matches those filters'}
            </h2>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
              {all.length === 0
                ? 'Commission requests and questions about pieces land here as soon as someone sends one.'
                : 'Clear a filter to see the rest of the inbox.'}
            </p>
          </div>
        ) : (
          <ul className="grid gap-2">
            {visible.map((inquiry) => (
              <li key={inquiry.id}>
                <Link
                  href={`/admin/inquiries/${inquiry.id}`}
                  className="border-border bg-card hover:border-primary/50 focus-visible:ring-ring flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[inquiry.status]}`}
                  >
                    {INQUIRY_STATUS_LABEL[inquiry.status]}
                  </span>
                  <Badge variant="outline">{INQUIRY_KIND_LABEL[inquiry.kind]}</Badge>

                  <span className="min-w-0 flex-1 basis-48">
                    <span
                      className={`block truncate text-sm ${inquiry.status === 'new' ? 'font-semibold' : 'font-medium'}`}
                    >
                      {inquirySummary(inquiry)}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {inquiry.name} · {inquiry.email}
                    </span>
                  </span>

                  <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">
                    {dateFormatter.format(new Date(inquiry.createdAt))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
