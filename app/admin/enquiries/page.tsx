import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AdminHeader } from '@/features/admin/components/admin-header';
import { EnquiryFilters } from '@/features/admin/components/enquiry-filters';
import { listEnquiries } from '@/lib/enquiries/repository';
import {
  ENQUIRY_KIND_LABEL,
  ENQUIRY_STATUS_LABEL,
  enquiryKindSchema,
  enquiryStatusSchema,
  enquirySummary,
  filterEnquiries,
  type EnquiryStatus,
} from '@/lib/enquiries/schema';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Enquiries — Voltage Reef studio' };

/** New is the one that should catch the eye; archived should not. */
const STATUS_STYLE: Record<EnquiryStatus, string> = {
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

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const all = await listEnquiries();

  // Unrecognised query values fall back to "no filter" rather than an empty
  // list, so a hand-edited URL never looks like an empty inbox.
  const status = enquiryStatusSchema.safeParse(params.status);
  const kind = enquiryKindSchema.safeParse(params.kind);
  const visible = filterEnquiries(all, {
    status: status.success ? status.data : null,
    kind: kind.success ? kind.data : null,
  });

  const unread = all.filter((enquiry) => enquiry.status === 'new').length;

  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Enquiries</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {all.length} total
            {unread > 0 ? ` · ${unread} unread` : ' · nothing unread'}
          </p>
        </div>

        <div className="mb-6">
          <EnquiryFilters />
        </div>

        {visible.length === 0 ? (
          <div className="border-border rounded-lg border border-dashed p-12 text-center">
            <Inbox className="text-muted-foreground mx-auto size-6" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-medium">
              {all.length === 0 ? 'No enquiries yet' : 'Nothing matches those filters'}
            </h2>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
              {all.length === 0
                ? 'Commission requests and questions about pieces land here as soon as someone sends one.'
                : 'Clear a filter to see the rest of the inbox.'}
            </p>
          </div>
        ) : (
          <ul className="grid gap-2">
            {visible.map((enquiry) => (
              <li key={enquiry.id}>
                <Link
                  href={`/admin/enquiries/${enquiry.id}`}
                  className="border-border bg-card hover:border-primary/50 focus-visible:ring-ring flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[enquiry.status]}`}
                  >
                    {ENQUIRY_STATUS_LABEL[enquiry.status]}
                  </span>
                  <Badge variant="outline">{ENQUIRY_KIND_LABEL[enquiry.kind]}</Badge>

                  <span className="min-w-0 flex-1 basis-48">
                    <span
                      className={`block truncate text-sm ${enquiry.status === 'new' ? 'font-semibold' : 'font-medium'}`}
                    >
                      {enquirySummary(enquiry)}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {enquiry.name} · {enquiry.email}
                    </span>
                  </span>

                  <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">
                    {dateFormatter.format(new Date(enquiry.createdAt))}
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
