import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { AdminHeader } from '@/features/admin/components/admin-header';
import { DeleteEnquiryButton } from '@/features/admin/components/delete-enquiry-button';
import { EnquiryStatusBar } from '@/features/admin/components/enquiry-status-bar';
import { setEnquiryNotesAction } from '@/features/admin/enquiry-actions';
import { getEnquiry, markEnquiryOpened } from '@/lib/enquiries/repository';
import {
  BUDGET_LABEL,
  ENQUIRY_KIND_LABEL,
  TIMEFRAME_LABEL,
} from '@/lib/enquiries/schema';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enquiry = await getEnquiry(id);
  return { title: enquiry ? `${enquiry.reference} — Voltage Reef studio` : 'Not found' };
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'short',
});

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{term}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enquiry = await getEnquiry(id);
  if (!enquiry) notFound();

  // Reading it is what makes it read. Only `new` moves, so this never walks a
  // replied enquiry backwards.
  await markEnquiryOpened(enquiry.id);

  const subject = `Re: your ${ENQUIRY_KIND_LABEL[enquiry.kind].toLowerCase()} — ${enquiry.reference}`;
  const greeting = `Hi ${enquiry.name.split(' ')[0]},\n\n`;
  const replyHref = `mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(greeting)}`;

  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href="/admin/enquiries">
            <ArrowLeft />
            Enquiries
          </Link>
        </Button>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{ENQUIRY_KIND_LABEL[enquiry.kind]}</Badge>
              <span className="text-muted-foreground font-mono text-xs">{enquiry.reference}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{enquiry.name}</h1>
            <a
              href={`mailto:${enquiry.email}`}
              className="text-primary text-sm hover:underline"
            >
              {enquiry.email}
            </a>
          </div>
          <Button asChild>
            <a href={replyHref}>
              <Mail />
              Reply
            </a>
          </Button>
        </div>

        <EnquiryStatusBar enquiryId={enquiry.id} status={enquiry.status} />

        <Separator className="my-6" />

        <section>
          <h2 className="mb-3 text-sm font-semibold">Message</h2>
          {/* Sender-supplied text. Rendered as plain text inside a paragraph -
              never as markup - so nothing a stranger types can become HTML. */}
          <p className="bg-muted rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {enquiry.message}
          </p>
        </section>

        {enquiry.kind === 'commission' ? (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold">The brief</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail term="Wants painted">{enquiry.subject || '—'}</Detail>
              <Detail term="Size in mind">{enquiry.size || 'No preference'}</Detail>
              <Detail term="Budget">
                {enquiry.budget ? BUDGET_LABEL[enquiry.budget] : 'No preference'}
              </Detail>
              <Detail term="Timeframe">
                {enquiry.timeframe ? TIMEFRAME_LABEL[enquiry.timeframe] : 'No preference'}
              </Detail>
            </dl>
          </section>
        ) : null}

        {enquiry.paintings.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold">
              {enquiry.paintings.length === 1 ? 'The piece' : 'The pieces'}
            </h2>
            <ul className="grid gap-2">
              {enquiry.paintings.map((painting) => (
                <li
                  key={painting.id}
                  className="border-border flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{painting.title}</p>
                    {/* Price as it stood when they asked, which is what they
                        believe they are being quoted. */}
                    <p className="text-muted-foreground text-xs">
                      {priceFormatter.format(painting.priceCents / 100)} at time of enquiry
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/store/${painting.slug}`} target="_blank" rel="noreferrer">
                      View
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold">Studio notes</h2>
          <form action={setEnquiryNotesAction} className="flex flex-col items-start gap-2">
            <input type="hidden" name="id" value={enquiry.id} />
            <Textarea
              name="notes"
              rows={3}
              defaultValue={enquiry.notes}
              placeholder="What you quoted, what you agreed, where it got to."
              aria-label="Private notes about this enquiry"
            />
            <Button type="submit" variant="outline" size="sm">
              Save notes
            </Button>
          </form>
        </section>

        <Separator className="my-6" />

        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-xs">
          <span>Received {dateFormatter.format(new Date(enquiry.createdAt))}</span>
          <DeleteEnquiryButton enquiryId={enquiry.id} name={enquiry.name} />
        </div>

        <p className="text-muted-foreground mt-6 text-xs">
          Replying opens your mail app addressed to {enquiry.name.split(' ')[0]}, with{' '}
          {enquiry.reference} in the subject. Mark it replied afterwards so the inbox stays honest.
        </p>
      </main>
    </>
  );
}
