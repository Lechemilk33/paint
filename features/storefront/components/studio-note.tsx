import { Brush, PackageCheck, Sparkles } from 'lucide-react';
import { STUDIO } from '../studio';
import { SpikeRule } from './spike-rule';

const NOTES = [
  {
    icon: Brush,
    title: 'Drawn straight, coloured wrong',
    body: 'The anatomy is observed - the way a puffer inflates, the way a rat holds its hands. The colour is not. That gap is the whole point of the work.',
  },
  {
    icon: Sparkles,
    title: 'Acrylic, ink, small canvas',
    body: 'Grounds are laid wet-on-wet and the subject is cut back into them opaque, then contoured in black. Nothing is airbrushed and nothing is printed.',
  },
  {
    icon: PackageCheck,
    title: 'One of each, sold direct',
    body: 'No editions and no reproductions. Put a piece on hold, send the enquiry, and the studio replies with payment and shipping.',
  },
];

export function StudioNote() {
  return (
    <section id="studio" className="mt-24 flex scroll-mt-24 flex-col gap-10">
      <SpikeRule className="text-acid/50" />
      <div className="flex flex-col gap-4">
        <h2 className="font-poster text-3xl font-extrabold tracking-tight sm:text-4xl">
          About the studio
        </h2>
        <p className="text-foreground-secondary max-w-2xl text-base leading-relaxed">
          {STUDIO.name} is a one-person studio making small, high-voltage paintings of animals real
          and invented. Everything on this page was painted by hand and photographed on the table it
          was made on.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {NOTES.map((note) => (
          <div key={note.title} className="flex flex-col gap-3">
            <note.icon aria-hidden="true" className="text-voltage size-5" />
            <h3 className="font-poster text-lg font-extrabold tracking-tight">{note.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{note.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
