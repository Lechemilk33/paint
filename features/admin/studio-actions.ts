'use server';

import { revalidatePath } from 'next/cache';
import { isSignedIn } from '@/lib/auth/session';
import { getStudio, saveStudio } from '@/lib/studio/repository';
import { studioSchema } from '@/lib/studio/schema';
import type { FormState } from './form-state';

async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) {
    throw new Error('Not signed in');
  }
}

export async function saveStudioAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const text = (key: string) => String(formData.get(key) ?? '').trim();

  const parsed = studioSchema.safeParse({
    name: text('name'),
    tagline: text('tagline'),
    about: text('about'),
    contactEmail: text('contactEmail'),
    shipping: text('shipping'),
    responseTime: text('responseTime'),
    // One phrase per line is the least fiddly way to edit a short list.
    marquee: text('marquee')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 12),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? '');
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { error: 'Check the highlighted fields', fieldErrors };
  }

  // An address that cannot receive mail is worse than none: the storefront
  // would render a broken contact link. Checked here rather than in the schema
  // so that an empty string stays valid.
  if (parsed.data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parsed.data.contactEmail)) {
    return {
      error: 'Check the highlighted fields',
      fieldErrors: { contactEmail: 'That does not look like an email address' },
    };
  }

  await saveStudio(parsed.data);

  // The studio's words appear in the header and footer of every store page.
  revalidatePath('/store', 'layout');
  revalidatePath('/admin/studio');
  return { error: null, fieldErrors: {} };
}

export async function currentStudio() {
  await requireAdmin();
  return getStudio();
}
