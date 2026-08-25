import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AVAILABILITY_LABEL, type Availability } from '@/lib/paintings/schema';

/** Availability reads as a color first: acid for on the wall, cyan for held,
 *  muted for gone or withheld. Text carries the same meaning, so color is never
 *  the only cue.
 *
 *  The fill is near-opaque ink rather than a tint of the status color, because
 *  this badge sits on top of a painting in the grid: a translucent fill would
 *  let the artwork decide the contrast behind the label, and these canvases go
 *  from black to fluorescent within a few pixels. */
const STATUS_STYLES: Record<Availability, string> = {
  available: 'text-acid border-acid/50',
  on_hold: 'text-voltage border-voltage/50',
  sold: 'text-muted-foreground border-border',
  not_for_sale: 'text-muted-foreground border-border',
};

export function StatusBadge({
  availability,
  className,
}: {
  availability: Availability;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-ink/85 tracking-label rounded-none border px-2 py-0.5 font-mono text-xs uppercase backdrop-blur-sm',
        STATUS_STYLES[availability],
        className,
      )}
    >
      {AVAILABILITY_LABEL[availability]}
    </Badge>
  );
}
