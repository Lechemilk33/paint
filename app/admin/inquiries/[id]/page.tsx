import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { AdminHeader } from '@/features/admin/components/admin-header';
import { DeleteInquiryButton } from '@/features/admin/components/delete-inquiry-button';
import { InquiryStatusBar } from '@/features/admin/components/inquiry-status-bar';
import { setInquiryNotesAction } from '@/features/admin/inquiry-actions';
import { getInquiry, markInquiryOpened } from '@/lib/inquiries/repository';
import {
  BUDGET_LABEL,
  INQUIRY_KIND_LABEL,
  PRINT_FINISH_LABEL,
  TIMEFRAME_LABEL,
  isCommissionShaped,
} from '@/lib/inquiries/schema';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inquiry = await getInquiry(id);
  return { title: inquiry ? `${inquiry.reference} — Voltage Reef studio` : 'Not found' };
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

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();

  // Reading it is what makes it read. Only `new` moves, so this never walks a
  // replied inquiry backwards.
  await markInquiryOpened(inquiry.id);

  const piecesHeading =
    inquiry.kind === 'similar'
      ? 'Working from'
      : inquiry.kind === 'print'
        ? 'Image to print'
        : inquiry.paintings.length === 1
          ? 'The piece'
          : 'The pieces';

  // Snapshotted per piece, so a print request that arrived before the studio
  // set a price still reads as unpriced however the piece is priced today.
  const printPriceCents = inquiry.paintings[0]?.printPriceCents ?? 0;

  const priceCaption = (price: string) =>
    inquiry.kind === 'print'
      ? `Original was ${price} when they asked. A print is priced separately.`
      : inquiry.kind === 'similar'
        ? `Reference piece, ${price} when they asked. A new painting is priced on its own.`
        : `${price} at time of inquiry`;

  const subject = `Re: your ${INQUIRY_KIND_LABEL[inquiry.kind].toLowerCase()} — ${inquiry.reference}`;
  const greeting = `Hi ${inquiry.name.split(' ')[0]},\n\n`;
  const replyHref = `mailto:${encodeURIComponent(inquiry.email)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(greeting)}`;

  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href="/admin/inquiries">
            <ArrowLeft />
            Inquiries
          </Link>
        </Button>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{INQUIRY_KIND_LABEL[inquiry.kind]}</Badge>
              <span className="text-muted-foreground font-mono text-xs">{inquiry.reference}</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{inquiry.name}</h1>
            <a
              href={`mailto:${inquiry.email}`}
              className="text-primary text-sm hover:underline"
            >
              {inquiry.email}
            </a>
          </div>
          <Button asChild>
            <a href={replyHref}>
              <Mail />
              Reply
            </a>
          </Button>
        </div>

        <InquiryStatusBar inquiryId={inquiry.id} status={inquiry.status} />

        <Separator className="my-6" />

        {/* A print request is fully described by the fields below it, so its
            message is optional and often empty. An empty box would read as a
            message that failed to save. */}
        {inquiry.message ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold">
              {inquiry.kind === 'similar' ? 'What they want changed' : 'Message'}
            </h2>
            {/* Sender-supplied text. Rendered as plain text inside a paragraph -
                never as markup - so nothing a stranger types can become HTML. */}
            <p className="bg-muted rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {inquiry.message}
            </p>
          </section>
        ) : null}

        {/* A commission and a request for something similar are the same job
            with a different starting point, so they share these fields. Only a
            commission has a written subject - for the other, the referenced
            canvas below is the subject. */}
        {isCommissionShaped(inquiry.kind) ? (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold">
              {inquiry.kind === 'commission' ? 'The brief' : 'What they are asking for'}
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              {inquiry.kind === 'commission' ? (
                <Detail term="Wants painted">{inquiry.subject || 'Not given'}</Detail>
              ) : null}
              <Detail term="Size in mind">{inquiry.size || 'No preference'}</Detail>
              <Detail term="Budget">
                {inquiry.budget ? BUDGET_LABEL[inquiry.budget] : 'No preference'}
              </Detail>
              <Detail term="Timeframe">
                {inquiry.timeframe ? TIMEFRAME_LABEL[inquiry.timeframe] : 'No preference'}
              </Detail>
            </dl>
          </section>
        ) : null}

        {inquiry.kind === 'print' ? (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold">The print</h2>
            <dl className="grid gap-4 sm:grid-cols-3">
              <Detail term="Size wanted">{inquiry.printSize || 'Not given'}</Detail>
              <Detail term="Printed on">
                {PRINT_FINISH_LABEL[inquiry.printFinish ?? 'either']}
              </Detail>
              <Detail term="How many">{inquiry.printQuantity}</Detail>
            </dl>
            {/* The per-print figure carried on this piece when they asked, and
                what it multiplies out to. Shown only where one was set: with no
                price on the piece, the storefront told them the studio would
                quote it, and repeating a total here would invent one. */}
            {printPriceCents > 0 ? (
              <dl className="border-border mt-4 grid gap-4 rounded-lg border p-3 sm:grid-cols-2">
                <Detail term="Price per print, when they asked">
                  {priceFormatter.format(printPriceCents / 100)}
                </Detail>
                <Detail term="That comes to">
                  {priceFormatter.format((printPriceCents * inquiry.printQuantity) / 100)} before
                  shipping
                </Detail>
              </dl>
            ) : null}
            <p className="text-muted-foreground mt-3 text-xs">
              {printPriceCents > 0
                ? 'The size is what they asked for, not what this image can be printed at, and the figure above is the list price on the piece - not a quote for this size or finish.'
                : 'Nothing here has been quoted or promised. The size is what they asked for, not what this image can be printed at.'}
            </p>
          </section>
        ) : null}

        {inquiry.paintings.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold">{piecesHeading}</h2>
            <ul className="grid gap-2">
              {inquiry.paintings.map((painting) => (
                <li
                  key={painting.id}
                  className="border-border flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{painting.title}</p>
                    {/* Price as it stood when they asked, which is what they
                        believe they are being quoted - except on a print or a
                        similar request, where the original's price is context
                        rather than an offer, and saying so here stops it being
                        quoted back at them by mistake. */}
                    <p className="text-muted-foreground text-xs">
                      {priceCaption(priceFormatter.format(painting.priceCents / 100))}
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
          <form action={setInquiryNotesAction} className="flex flex-col items-start gap-2">
            <input type="hidden" name="id" value={inquiry.id} />
            <Textarea
              name="notes"
              rows={3}
              defaultValue={inquiry.notes}
              placeholder="What you quoted, what you agreed, where it got to."
              aria-label="Private notes about this inquiry"
            />
            <Button type="submit" variant="outline" size="sm">
              Save notes
            </Button>
          </form>
        </section>

        <Separator className="my-6" />

        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 text-xs">
          <span>Received {dateFormatter.format(new Date(inquiry.createdAt))}</span>
          <DeleteInquiryButton inquiryId={inquiry.id} name={inquiry.name} />
        </div>

        <p className="text-muted-foreground mt-6 text-xs">
          Replying opens your mail app addressed to {inquiry.name.split(' ')[0]}, with{' '}
          {inquiry.reference} in the subject. Mark it replied afterwards so the inbox stays honest.
        </p>
      </main>
    </>
  );
}
