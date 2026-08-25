import { redirect } from 'next/navigation';

/** The storefront lives under /store; the bare domain goes straight there. */
export default function RootPage() {
  redirect('/store');
}
