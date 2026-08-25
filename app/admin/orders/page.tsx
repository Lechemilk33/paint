import Link from 'next/link';
import { Package, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/features/admin/components/admin-header';
import { setFulfillmentAction, setOrderStatusAction } from '@/features/admin/order-actions';
import { listOrders } from '@/lib/orders/repository';
import {
  FULFILLMENT_LABEL,
  ORDER_STATUS_LABEL,
  formatOrderTotal,
  type Order,
} from '@/lib/orders/schema';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Orders — Voltage Reef studio' };

const STATUS_STYLE: Record<Order['status'], string> = {
  paid: 'bg-success-subtle text-success',
  needs_refund: 'bg-destructive text-white',
  refunded: 'bg-muted text-muted-foreground',
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/** The address as you would write it on a label, blank lines dropped. */
function addressLines(order: Order): string[] {
  const { shippingAddress: a } = order;
  return [
    a.name,
    a.line1,
    a.line2,
    [a.city, a.state, a.postalCode].filter(Boolean).join(' '),
    a.country,
  ].filter((line) => line.trim() !== '');
}

function OrderRow({ order }: { order: Order }) {
  const lines = addressLines(order);

  return (
    <li className="border-border bg-card rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">{order.reference}</span>
            <Badge className={STATUS_STYLE[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
            <Badge variant="outline">{FULFILLMENT_LABEL[order.fulfillment]}</Badge>
          </div>

          <h2 className="mt-1.5 font-medium">
            {order.paintingSlug ? (
              <Link href={`/store/${order.paintingSlug}`} className="hover:underline">
                {order.paintingTitle}
              </Link>
            ) : (
              order.paintingTitle
            )}
          </h2>

          <p className="text-muted-foreground mt-0.5 text-sm">
            {order.buyerName || 'No name given'}
            {order.buyerEmail ? (
              <>
                {' · '}
                <a href={`mailto:${order.buyerEmail}`} className="hover:underline">
                  {order.buyerEmail}
                </a>
              </>
            ) : null}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {dateFormatter.format(new Date(order.createdAt))}
          </p>
        </div>

        <div className="text-right">
          <p className="font-semibold tabular-nums">{formatOrderTotal(order)}</p>
          {order.shippingCents > 0 ? (
            <p className="text-muted-foreground text-xs tabular-nums">
              incl. {(order.shippingCents / 100).toFixed(2)} shipping
            </p>
          ) : null}
        </div>
      </div>

      {order.status === 'needs_refund' ? (
        <p className="bg-destructive/10 text-destructive mt-3 flex items-start gap-2 rounded-md p-3 text-sm">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            This piece was already sold when the payment landed, so it has been charged for a canvas
            that is gone. Refund it in the Stripe dashboard, then mark it refunded here.
          </span>
        </p>
      ) : null}

      {lines.length > 0 ? (
        <address className="text-muted-foreground mt-3 text-sm not-italic">
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {order.status === 'paid' ? (
          <form action={setFulfillmentAction}>
            <input type="hidden" name="id" value={order.id} />
            <input
              type="hidden"
              name="fulfillment"
              value={order.fulfillment === 'shipped' ? 'unshipped' : 'shipped'}
            />
            <Button type="submit" size="sm" variant={order.fulfillment === 'shipped' ? 'outline' : 'default'}>
              {order.fulfillment === 'shipped' ? 'Mark not shipped' : 'Mark shipped'}
            </Button>
          </form>
        ) : null}

        {order.status === 'needs_refund' ? (
          <form action={setOrderStatusAction}>
            <input type="hidden" name="id" value={order.id} />
            <input type="hidden" name="status" value="refunded" />
            <Button type="submit" size="sm" variant="outline">
              Mark refunded
            </Button>
          </form>
        ) : null}

        {order.stripePaymentIntentId ? (
          <Button asChild size="sm" variant="ghost">
            <a
              href={`https://dashboard.stripe.com/payments/${order.stripePaymentIntentId}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Stripe
            </a>
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export default async function OrdersPage() {
  const orders = await listOrders();
  const unshipped = orders.filter(
    (order) => order.status === 'paid' && order.fulfillment === 'unshipped',
  ).length;

  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {orders.length} total
            {unshipped > 0 ? ` · ${unshipped} to ship` : ' · nothing waiting to ship'}
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="border-border rounded-lg border border-dashed p-12 text-center">
            <Package className="text-muted-foreground mx-auto size-6" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-medium">No orders yet</h2>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
              Card payments land here the moment Stripe confirms them. Switch on &ldquo;Let people
              buy this outright&rdquo; on a painting to start taking them.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
