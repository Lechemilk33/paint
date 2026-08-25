import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/features/admin/components/admin-header';
import { PaintingForm } from '@/features/admin/components/painting-form';

export const metadata = { title: 'New painting — Voltage Reef studio' };

export default function NewPaintingPage() {
  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href="/admin">
            <ArrowLeft />
            All paintings
          </Link>
        </Button>
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">New painting</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Fill in the details, then add photos on the next screen.
        </p>
        <PaintingForm />
      </main>
    </>
  );
}
