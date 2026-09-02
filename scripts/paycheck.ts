/**
 * Exercises the two invariants the payment path depends on, against the local
 * blob backend: a canvas cannot be sold to two buyers, and a redelivered
 * webhook cannot turn one good sale into a refund.
 */
import { createPainting, deletePainting, markPaintingSold } from '../lib/paintings/repository';
import { liveHold, releaseHold, takeHold } from '../lib/orders/holds';
import { CHECKOUT_WINDOW_MS, HOLD_MS } from '../lib/orders/holds';

let failures = 0;
function check(label: string, pass: boolean, detail = '') {
  console.log(`${pass ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!pass) failures += 1;
}

async function main() {
  // This creates and deletes a real painting in whatever store it can reach.
  // On Netlify that would be the live catalog, so it refuses to run there.
  if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT) {
    console.error('paycheck writes to the catalog and will not run against Netlify Blobs.');
    process.exit(1);
  }

  check(
    'hold outlives the checkout window',
    HOLD_MS > CHECKOUT_WINDOW_MS,
    `hold ${HOLD_MS / 60000}m vs session ${CHECKOUT_WINDOW_MS / 60000}m`,
  );
  check(
    'checkout window clears Stripe 30-minute floor',
    CHECKOUT_WINDOW_MS > 30 * 60 * 1000,
    `${CHECKOUT_WINDOW_MS / 60000}m`,
  );

  const painting = await createPainting({
    title: `Paycheck Probe ${Date.now()}`,
    year: 2025,
    medium: 'acrylic on canvas',
    heightIn: 24,
    widthIn: 18,
    priceCents: 120000,
    series: '',
    blurb: '',
    framingShipping: '',
    story: '',
    edition: 'original',
    availability: 'available',
    shippingCents: 4500,
    instantCheckout: true,
    printsAvailable: false,
    driveFolder: '',
    notes: '',
  });

  try {
    // --- holds ------------------------------------------------------------
    const claims = await Promise.all(Array.from({ length: 10 }, () => takeHold(painting.id)));
    const winners = claims.filter((c) => c.ok);
    check('one winner from ten simultaneous claims', winners.length === 1, `${winners.length} won`);

    const winner = winners[0];
    if (!winner.ok) throw new Error('no winner');

    check('a later claim is refused while held', !(await takeHold(painting.id)).ok);

    await releaseHold(painting.id, 'wrong-hold-id');
    check('a wrong hold id cannot release the hold', (await liveHold(painting.id)) !== null);

    await releaseHold(painting.id, winner.hold.holdId);
    check('the right hold id releases it', (await liveHold(painting.id)) === null);

    // --- sales ------------------------------------------------------------
    const first = await markPaintingSold(painting.id, 'cs_test_ALPHA');
    check('first payment sells the piece', first.ok && first.painting.availability === 'sold');

    const retry = await markPaintingSold(painting.id, 'cs_test_ALPHA');
    check(
      'a redelivered webhook for the same session is still ok (no false refund)',
      retry.ok,
      retry.ok ? '' : `got reason=${retry.reason}`,
    );

    const second = await markPaintingSold(painting.id, 'cs_test_BETA');
    check(
      'a different session on a sold piece is refused',
      !second.ok && second.reason === 'already_sold',
      second.ok ? 'it was allowed' : `reason=${second.reason}`,
    );

    const gone = await markPaintingSold('no-such-painting', 'cs_test_GAMMA');
    check('a missing painting is reported, not invented', !gone.ok && gone.reason === 'missing');
  } finally {
    await deletePainting(painting.id);
  }

  console.log(failures === 0 ? '\nAll payment invariants held.' : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
