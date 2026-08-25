import type { Metadata } from 'next';
import { Syne } from 'next/font/google';
import { CartProvider } from '@/features/storefront/components/cart-provider';
import { StoreFooter } from '@/features/storefront/components/store-footer';
import { StoreHeader } from '@/features/storefront/components/store-header';
import { listVisiblePaintings } from '@/lib/paintings/public';
import { getStudio } from '@/lib/studio/repository';

// The poster face for the storefront only. Loaded here rather than in the root
// layout so the CRM never pays for a font it does not use.
const syne = Syne({
  subsets: ['latin'],
  display: 'swap',
  weight: ['700', '800'],
  variable: '--font-syne',
});

export const metadata: Metadata = {
  title: 'Psychedelic realism paintings',
  description: 'Original paintings, sold direct from the studio.',
};

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  // The cart holds ids; the sheet needs the records behind them. Loading the
  // catalog once here means opening the cart costs no request of its own.
  const [paintings, studio] = await Promise.all([listVisiblePaintings(), getStudio()]);

  return (
    // `storefront` swaps the token palette for the whole subtree and `dark`
    // keeps any dark: variant inside the primitives on the right side of the
    // fence, regardless of the visitor's app theme.
    <div className={`${syne.variable} storefront dark bg-background text-foreground min-h-svh`}>
      <CartProvider paintings={paintings}>
        <StoreHeader studio={studio} />
        <main>{children}</main>
        <StoreFooter studio={studio} />
      </CartProvider>
    </div>
  );
}
