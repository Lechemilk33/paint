import { AdminHeader } from '@/features/admin/components/admin-header';
import { StudioForm } from '@/features/admin/components/studio-form';
import { getStudio } from '@/lib/studio/repository';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Studio settings — Voltage Reef studio' };

export default async function StudioSettingsPage() {
  const studio = await getStudio();

  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Studio</h1>
        <p className="text-muted-foreground mt-1 mb-8 text-sm">
          The words the storefront uses about you. Anything left blank is left out of the site
          rather than filled in with something invented.
        </p>
        <StudioForm studio={studio} />
      </main>
    </>
  );
}
