
"use client";

import { useState, useEffect } from 'react'; // Added useEffect
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
import { submitEcommOrder, type EcommOrderPayload } from '@/app/actions/submitEcommOrder'; 
import { useAuth } from '@/context/AuthContext'; // Import useAuth

export default function CheckoutPage() {
  const cartContext = useCart();
  const authContext = useAuth(); // Get auth context
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Redirect if cart is empty AFTER hydration and cart context is ready
    if (cartContext && cartContext.isCartReady && cartContext.cartItems.length === 0) {
      toast({
        title: "Your cart is empty",
        description: "Redirecting you to continue shopping.",
        variant: "default"
      });
      router.replace('/cart');
    }
  }, [cartContext, router, toast]);


  if (!cartContext || !cartContext.isCartReady || authContext.loading) {
    return (
      <main className="container mx-auto px-4 py-12 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading checkout...</p>
      </main>
    );
  }

  const { cartItems, getCartTotal, getItemCount, clearCart } = cartContext;
  const { user } = authContext;


  const handlePlaceOrder = async (formData: CheckoutFormData) => {
    setIsSubmitting(true);
    toast({ title: "Processing your order...", description: "Please wait a moment." });

    const orderPayload: EcommOrderPayload = {
      customerInfo: {
        name: formData.name,
        phone: formData.phone,
        email: formData.email, // This email is from the form
        address: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
      },
      orderedProducts: cartItems.map(item => ({
        productId: item.id, 
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image, 
      })),
      totalAmount: getCartTotal(),
      paymentMethod: formData.paymentMethod,
      userId: user ? user.uid : undefined,
      userEmail: user && user.email ? user.email : undefined, // Logged-in user's email
      userName: user && user.displayName ? user.displayName : undefined, // Logged-in user's name
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

      {cartItems.length === 0 ? ( // This might briefly show before useEffect redirect
         <div className="text-center py-10">
            <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground opacity-50 mb-6" />
            <p className="text-xl text-muted-foreground mb-4">Your cart is empty.</p>
            <Button asChild><Link href="/">Continue Shopping</Link></Button>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <CheckoutForm 
            onSubmit={handlePlaceOrder} 
            isSubmitting={isSubmitting} 
            // Pass initial email if user is logged in
            initialEmail={user?.email || undefined} 
            initialName={user?.displayName || undefined}
          />
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
