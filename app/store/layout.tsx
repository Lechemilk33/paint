import type { Metadata } from 'next';
import { Syne } from 'next/font/google';
import { CartProvider } from '@/features/storefront/components/cart-provider';
import { StoreFooter } from '@/features/storefront/components/store-footer';
import { StoreHeader } from '@/features/storefront/components/store-header';

// The poster face for the storefront only. Loaded here rather than in the root
// layout so the CRM never pays for a font it does not use.
const syne = Syne({
  subsets: ['latin'],
  display: 'swap',
  weight: ['700', '800'],
  variable: '--font-syne',
});

export const metadata: Metadata = {
  title: 'Voltage Reef — psychedelic realism paintings',
  description:
    'Original acrylic paintings of animals real and invented, drawn with real anatomy and coloured like a power surge. One of each, sold direct from the studio.',
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    // `storefront` swaps the token palette for the whole subtree and `dark`
    // keeps any dark: variant inside the primitives on the right side of the
    // fence, regardless of the visitor's app theme.
    <div className={`${syne.variable} storefront dark bg-background text-foreground min-h-svh`}>
      <CartProvider>
        <StoreHeader />
        <main>{children}</main>
        <StoreFooter />
      </CartProvider>
    </div>
  );
}
