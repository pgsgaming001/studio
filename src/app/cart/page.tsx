
'use client';

import { useCart, type CartItem } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, ArrowLeft, ShoppingBag, Minus, Plus, CreditCard, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const cartContext = useCart();
  const { toast } = useToast();
  const router = useRouter();

  if (!cartContext || !cartContext.isCartReady) {
    return (
      <main className="container mx-auto px-4 py-12 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading your cart...</p>
      </main>
    );
  }
  
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, getItemCount, clearCart } = cartContext;

  const handleQuantityChange = (productId: string, newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr);
    if (!isNaN(newQuantity)) {
      updateQuantity(productId, Math.max(0, newQuantity)); // Ensure quantity doesn't go below 0, remove if 0
    } else if (newQuantityStr === "") {
      // Allow temporary empty state in input, maybe handle on blur or specific action
    }
  };
  
  const incrementQuantity = (productId: string, currentQuantity: number) => {
    updateQuantity(productId, currentQuantity + 1);
  };

  const decrementQuantity = (productId: string, currentQuantity: number) => {
    updateQuantity(productId, Math.max(1, currentQuantity - 1)); // Prevent going below 1 directly with button
  };


  const handleProceedToCheckout = () => {
    if (cartItems.length > 0) {
      router.push('/checkout'); 
    } else {
      toast({
        title: "Your cart is empty",
        description: "Please add items to your cart before proceeding to checkout.",
        variant: "destructive"
      });
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="container mx-auto px-4 py-12 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center">
        <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground opacity-50 mb-6" />
        <h1 className="text-3xl font-headline text-primary mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Start Shopping
          </Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">Your Shopping Cart</h1>
        <Button variant="outline" onClick={() => {
          clearCart();
          toast({ title: "Cart Cleared", description: "All items removed from your cart."});
          }} 
          className="text-sm border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={cartItems.length === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {cartItems.map((item: CartItem) => (
            <Card key={item.id} className="flex flex-col sm:flex-row items-stretch gap-4 p-4 shadow-md rounded-xl overflow-hidden">
              <div className="relative w-full sm:w-32 h-32 sm:h-auto rounded-md overflow-hidden border bg-secondary shrink-0">
                <Image
                  src={item.image || "https://placehold.co/128x128.png"}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 128px"
                  className="object-cover"
                  data-ai-hint={item.name.split(" ").slice(0,2).join(" ")}
                />
              </div>
              <div className="flex-grow flex flex-col justify-between py-2 sm:py-0">
                <div>
                  <Link href={`/product/${item.id}`} className="hover:underline">
                    <h3 className="text-lg font-semibold text-card-foreground leading-tight">{item.name}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                  <p className="text-lg font-medium text-primary mt-1 sm:mt-2">${item.price.toFixed(2)}</p>
                </div>
                 <div className="flex items-center space-x-2 mt-3 sm:mt-auto">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => decrementQuantity(item.id, item.quantity)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity.toString()}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      onBlur={(e) => { 
                         const val = parseInt(e.target.value);
                         if (isNaN(val) || val < 1) updateQuantity(item.id, 1);
                      }}
                      className="h-8 w-14 text-center px-1"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => incrementQuantity(item.id, item.quantity)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive self-start sm:self-center ml-auto sm:ml-4 mt-2 sm:mt-0"
                onClick={() => removeFromCart(item.id)}
                aria-label="Remove item"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <Card className="shadow-xl rounded-xl">
            <CardHeader className="bg-primary/5">
              <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <CreditCard className="mr-2 h-6 w-6" /> Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({getItemCount()} items)</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="font-medium text-primary">FREE</span> 
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                size="lg" 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-base py-6 shadow-md"
                onClick={handleProceedToCheckout}
                disabled={cartItems.length === 0}
              >
                Proceed to Checkout
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </main>
  );
}
