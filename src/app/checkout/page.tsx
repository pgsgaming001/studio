
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, type CartItem } from '@/context/CartContext';
import { CheckoutForm, type CheckoutFormData } from '@/components/features/ecommerce/CheckoutForm';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CreditCard, ShoppingBag, AlertTriangle, Loader2 } from 'lucide-react';
import { submitEcommOrder } from '@/app/actions/submitEcommOrder'; 

export default function CheckoutPage() {
  const cartContext = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!cartContext || !cartContext.isCartReady) {
    return (
      <main className="container mx-auto px-4 py-12 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading checkout...</p>
      </main>
    );
  }

  const { cartItems, getCartTotal, getItemCount, clearCart } = cartContext;

  if (cartItems.length === 0 && cartContext.isCartReady) { // Ensure cart is ready before redirecting
    // Redirect to cart page or homepage if cart is empty, handled after hydration
    // It's better to handle this with a useEffect to prevent issues during SSR/hydration
    if (typeof window !== "undefined") {
         router.replace('/cart');
    }
    return (
         <main className="container mx-auto px-4 py-12 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-primary mb-4" />
            <p className="text-xl text-muted-foreground">Your cart is empty. Redirecting...</p>
        </main>
    );
  }


  const handlePlaceOrder = async (formData: CheckoutFormData) => {
    setIsSubmitting(true);
    toast({ title: "Processing your order...", description: "Please wait a moment." });

    const orderPayload = {
      customerInfo: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
      },
      orderedProducts: cartItems.map(item => ({
        productId: item.id, // Assuming item.id is the MongoDB _id string
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image, // Include image for potential future use in order display
      })),
      totalAmount: getCartTotal(),
      paymentMethod: formData.paymentMethod,
      // Order status will be set to 'pending' by default in the server action
    };

    try {
      const result = await submitEcommOrder(orderPayload);
      if (result.success && result.orderId) {
        clearCart();
        toast({
          title: "Order Placed Successfully!",
          description: `Your order ID is ${result.orderId.substring(0, 8)}...`,
          variant: "default",
        });
        router.push(`/order-confirmation-ecomm?orderId=${result.orderId}`);
      } else {
        throw new Error(result.error || "Failed to place order. Please try again.");
      }
    } catch (error: any) {
      console.error("Checkout submission error:", error);
      toast({
        title: "Order Placement Failed",
        description: error.message || "An unexpected error occurred. Please check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm" className="text-muted-foreground hover:text-primary">
          <Link href="/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </Button>
      </div>
      <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-8 text-center">Checkout</h1>

      {cartItems.length === 0 && cartContext.isCartReady ? (
         <div className="text-center py-10">
            <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground opacity-50 mb-6" />
            <p className="text-xl text-muted-foreground mb-4">Your cart is empty.</p>
            <Button asChild><Link href="/">Continue Shopping</Link></Button>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <CheckoutForm onSubmit={handlePlaceOrder} isSubmitting={isSubmitting} />
        </div>

        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <Card className="shadow-xl rounded-xl">
            <CardHeader className="bg-primary/5">
              <CardTitle className="font-headline text-2xl text-primary flex items-center">
                <ShoppingBag className="mr-2 h-6 w-6" /> Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden border bg-secondary shrink-0">
                    <Image
                      src={item.image || "https://placehold.co/48x48.png"}
                      alt={item.name}
                      fill sizes="48px" className="object-cover"
                      data-ai-hint={item.name.split(" ").slice(0,1).join(" ")}
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-card-foreground truncate w-40" title={item.name}>{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({getItemCount()} items)</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="font-medium text-primary">FREE</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-xl text-foreground">
                <span>Total</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </main>
  );
}
