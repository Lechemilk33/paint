'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isSignedIn } from '@/lib/auth/session';
import {
  deleteInquiry,
  setInquiryNotes,
  setInquiryStatus,
} from '@/lib/inquiries/repository';
import { inquiryStatusSchema } from '@/lib/inquiries/schema';

/** A server action is its own endpoint, so it re-checks rather than trusting
 *  the gate that already turned unauthenticated requests away. */
async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) {
    throw new Error('Not signed in');
  }
}

function revalidateInbox(id?: string): void {
  revalidatePath('/admin/inquiries');
  revalidatePath('/admin');
  if (id) revalidatePath(`/admin/inquiries/${id}`);
}

export async function setInquiryStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  const status = inquiryStatusSchema.safeParse(formData.get('status'));
  if (!id || !status.success) return;

  await setInquiryStatus(id, status.data);
  revalidateInbox(id);
}

export async function setInquiryNotesAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await setInquiryNotes(id, String(formData.get('notes') ?? ''));
  revalidateInbox(id);
}

export async function deleteInquiryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await deleteInquiry(id);
  revalidateInbox();
  redirect('/admin/inquiries');
}
