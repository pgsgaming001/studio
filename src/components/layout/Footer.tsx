
'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-secondary/70 text-secondary-foreground mt-12 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-2">
              <Package className="h-7 w-7 text-primary" />
              <span className="font-bold text-2xl font-headline text-primary">Xerox2U</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your all-in-one platform for on-demand document printing and high-quality e-commerce products.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:col-span-2">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Services</h4>
              <nav className="flex flex-col space-y-2 text-sm">
                <Link href="/#print" className="text-muted-foreground hover:text-primary">Print Service</Link>
                <Link href="/#ecommerce" className="text-muted-foreground hover:text-primary">Online Store</Link>
                <Link href="/my-orders" className="text-muted-foreground hover:text-primary">My Orders</Link>
              </nav>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Company</h4>
              <nav className="flex flex-col space-y-2 text-sm">
                <Link href="/about" className="text-muted-foreground hover:text-primary">About Us</Link>
                <Link href="/contact" className="text-muted-foreground hover:text-primary">Contact</Link>
              </nav>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Legal</h4>
              <nav className="flex flex-col space-y-2 text-sm">
                <Link href="/terms-and-conditions" className="text-muted-foreground hover:text-primary">Terms & Conditions</Link>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link>
                <Link href="/faq" className="text-muted-foreground hover:text-primary">FAQ</Link>
              </nav>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Xerox2U. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
