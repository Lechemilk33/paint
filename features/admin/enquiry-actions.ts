'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isSignedIn } from '@/lib/auth/session';
import {
  deleteEnquiry,
  setEnquiryNotes,
  setEnquiryStatus,
} from '@/lib/enquiries/repository';
import { enquiryStatusSchema } from '@/lib/enquiries/schema';

/** A server action is its own endpoint, so it re-checks rather than trusting
 *  the gate that already turned unauthenticated requests away. */
async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) {
    throw new Error('Not signed in');
  }
}

function revalidateInbox(id?: string): void {
  revalidatePath('/admin/enquiries');
  revalidatePath('/admin');
  if (id) revalidatePath(`/admin/enquiries/${id}`);
}

export async function setEnquiryStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  const status = enquiryStatusSchema.safeParse(formData.get('status'));
  if (!id || !status.success) return;

  await setEnquiryStatus(id, status.data);
  revalidateInbox(id);
}

export async function setEnquiryNotesAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await setEnquiryNotes(id, String(formData.get('notes') ?? ''));
  revalidateInbox(id);
}

export async function deleteEnquiryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await deleteEnquiry(id);
  revalidateInbox();
  redirect('/admin/enquiries');
}
