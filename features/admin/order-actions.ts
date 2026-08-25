'use server';

import { revalidatePath } from 'next/cache';
import { isSignedIn } from '@/lib/auth/session';
import { setOrderFulfillment, setOrderNotes, setOrderStatus } from '@/lib/orders/repository';
import { fulfillmentSchema, orderStatusSchema } from '@/lib/orders/schema';

/**
 * The studio's side of an order. Deliberately small: an order's money is
 * Stripe's record and its existence is the webhook's, so the only things
 * editable here are the two the studio knows and Stripe does not - whether the
 * canvas has actually gone out, and whether a refund has been dealt with.
 */
async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) throw new Error('Not signed in');
}

export async function setFulfillmentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const parsed = fulfillmentSchema.safeParse(formData.get('fulfillment'));
  if (!id || !parsed.success) return;

  await setOrderFulfillment(id, parsed.data);
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}

export async function setOrderStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const parsed = orderStatusSchema.safeParse(formData.get('status'));
  if (!id || !parsed.success) return;

  await setOrderStatus(id, parsed.data);
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}

export async function setOrderNotesAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  await setOrderNotes(id, String(formData.get('notes') ?? '').slice(0, 4000));
  revalidatePath('/admin/orders');
}
