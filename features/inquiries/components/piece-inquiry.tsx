'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Painting } from '@/lib/paintings/schema';
import { InquiryForm } from './inquiry-form';

/**
 * "Ask about this piece", inline on the painting's own page.
 *
 * Deliberately not a dialog: the question someone wants to ask is about the
 * canvas they are looking at, and a modal covers it up. Expanding in place
 * keeps the painting on screen while they write, and leaves the form
 * linkable at #ask.
 */
export function PieceInquiry({ painting }: { painting: Painting }) {
  const [isOpen, setOpen] = useState(false);

  const snapshot = [
    {
      id: painting.id,
      title: painting.title,
      slug: painting.slug,
      priceCents: painting.priceCents,
    },
  ];

  if (!isOpen) {
    return (
      <Button
        type="button"
        size="lg"
        variant="outline"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-controls="ask"
        className="border-voltage/50 text-voltage hover:bg-voltage/10 hover:text-voltage tracking-label rounded-none font-mono text-xs uppercase"
      >
        <MessageSquare aria-hidden="true" />
        Ask about this piece
      </Button>
    );
  }

  return (
    <section id="ask" className="border-border scroll-mt-24 border-t pt-6">
      <h2 className="font-poster mb-1 text-xl font-extrabold tracking-tight">
        Ask about {painting.title}
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Condition, framing, shipping, whether something similar can be painted - anything.
      </p>
      <InquiryForm kind="piece" paintings={snapshot} submitLabel="Send question" />
    </section>
  );
}
