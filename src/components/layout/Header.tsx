
'use client';

import Link from 'next/link';
import { ShoppingCartIcon, Package, LogIn, LogOut, UserCircle, Loader2, Settings, ShieldCheck, ListOrdered } from 'lucide-react'; // Added ListOrdered
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export function Header() {
  const cartContext = useCart();
  const authContext = useAuth(); 

  const itemCount = cartContext && cartContext.isCartReady ? cartContext.getItemCount() : 0;

  const getAvatarFallback = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };
  
  const isAdminUser = authContext.user && authContext.user.email === 'pgsviews@gmail.com'; 

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl font-headline text-primary">Xerox2U</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          {/* Future navigation links */}
        </nav>
        <div className="flex items-center space-x-2 md:space-x-4">
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/cart" aria-label="Shopping Cart">
              <ShoppingCartIcon className="h-5 w-5 md:h-6 md:w-6" />
              {itemCount > 0 && cartContext.isCartReady && (
                <Badge
                  variant="destructive"
                  className="absolute top-[-6px] right-[-6px] h-[18px] md:h-[20px] min-w-[18px] md:min-w-[20px] flex items-center justify-center rounded-full px-1 text-xs leading-none"
                >
                  {itemCount > 9 ? "9+" : itemCount}
                </Badge>
              )}
            </Link>
          </Button>

          {authContext.loading ? (
            <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin text-muted-foreground" />
          ) : authContext.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full">
                   <Avatar className="h-8 w-8 md:h-9 md:w-9">
                    <AvatarImage src={authContext.user.photoURL || undefined} alt={authContext.user.displayName || "User"} />
                    <AvatarFallback>{getAvatarFallback(authContext.user.displayName, authContext.user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {authContext.user.displayName || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {authContext.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/my-orders" className="cursor-pointer w-full">
                      <ListOrdered className="mr-2 h-4 w-4" /> My Orders
                    </Link>
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem asChild><Link href="/profile" className="cursor-pointer w-full"><UserCircle className="mr-2 h-4 w-4" /> Profile</Link></DropdownMenuItem> */}
                  {/* <DropdownMenuItem asChild><Link href="/settings" className="cursor-pointer w-full"><Settings className="mr-2 h-4 w-4" /> Settings</Link></DropdownMenuItem> */}
                   {isAdminUser && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="cursor-pointer w-full">
                            <ShieldCheck className="mr-2 h-4 w-4 text-blue-500" /> Print Admin
                        </Link>
                    </DropdownMenuItem>
                  )}
                   {isAdminUser && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin/ecommerce-dashboard" className="cursor-pointer w-full">
                            <ShoppingCartIcon className="mr-2 h-4 w-4 text-green-500" /> E-comm Admin
                        </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={authContext.signOutUser} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={authContext.signInWithGoogle} variant="outline" size="sm">
              <LogIn className="mr-1.5 h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
