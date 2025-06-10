'use client';

import Link from 'next/link';
import { ShoppingCartIcon, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';

export function Header() {
  const cartContext = useCart();
  
  // Default itemCount to 0 or actual count if context is ready
  const itemCount = cartContext && cartContext.isCartReady ? cartContext.getItemCount() : 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl font-headline text-primary">Xerox2U</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          {/* Future navigation links can go here */}
          {/* Example: <Link href="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Products</Link> */}
        </nav>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart" aria-label="Shopping Cart">
              <ShoppingCartIcon className="h-6 w-6" />
              {itemCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs">
                  {itemCount}
                </Badge>
              )}
            </Link>
          </Button>
          {/* Placeholder for Login/Profile button */}
          {/* <Button variant="outline" size="sm">Login</Button> */}
        </div>
      </div>
    </header>
  );
}
