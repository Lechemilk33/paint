import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studio — Voltage Reef',
  robots: { index: false, follow: false },
};

/**
 * The admin shell. Middleware turns away anyone without a valid session before
 * this renders. The login route sits inside /admin so it is covered by the same
 * fence, which is why the signed-in header is drawn per-page rather than here -
 * here it would also frame the login form.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-background text-foreground min-h-svh">{children}</div>;
}
