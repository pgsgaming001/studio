
"use client";

import { useState, useEffect } from 'react'; 
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
import { createRazorpayOrder } from '@/app/actions/createRazorpayOrder';
import { useAuth } from '@/context/AuthContext'; 

declare global {
  interface Window {
    Razorpay: any; 
  }
}

export default function CheckoutPage() {
  const cartContext = useCart();
  const authContext = useAuth(); 
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);

  useEffect(() => {
    if (cartContext && cartContext.isCartReady && cartContext.cartItems.length === 0) {
      toast({
        title: "Your cart is empty",
        description: "Redirecting you to continue shopping.",
        variant: "default"
      });
      router.replace('/cart');
    }
  }, [cartContext, router, toast]);

  useEffect(() => {
    // Fetch Razorpay Key ID when component mounts, if not already fetched
    // This is mainly for the Razorpay instance, but could be part of createRazorpayOrder response
    const fetchKey = async () => {
        try {
            // A dummy call just to get the key if createRazorpayOrder is designed to return it even on error or initial call
            // Or have a separate action if needed. For now, we'll get it from createRazorpayOrder response.
        } catch (error) {
            console.error("Could not pre-fetch Razorpay key:", error);
        }
    };
    // fetchKey(); // Not strictly necessary to pre-fetch, can get from order creation.
  }, []);


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

  const handleFinalOrderSubmission = async (payload: EcommOrderPayload) => {
    const result = await submitEcommOrder(payload);
    if (result.success && result.orderId) {
      clearCart();
      toast({
        title: "Order Placed Successfully!",
        description: `Your order ID is ${result.orderId.substring(0, 8)}...`,
        variant: "default",
      });
      router.push(`/order-confirmation-ecomm?orderId=${result.orderId}`);
    } else {
      throw new Error(result.error || "Failed to save order after payment. Please try again.");
    }
  };

  const handlePlaceOrder = async (formData: CheckoutFormData) => {
    setIsSubmitting(true);
    toast({ title: "Processing your order...", description: "Please wait a moment." });

    const baseOrderPayload: Omit<EcommOrderPayload, 'paymentDetails'> = {
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
        productId: item.id, 
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image, 
      })),
      totalAmount: getCartTotal(),
      paymentMethod: formData.paymentMethod,
      userId: user ? user.uid : undefined,
      userEmail: user && user.email ? user.email : undefined, 
      userName: user && user.displayName ? user.displayName : undefined, 
    };

    if (formData.paymentMethod === "cod") {
      try {
        await handleFinalOrderSubmission({ ...baseOrderPayload, paymentDetails: undefined });
      } catch (error: any) {
        console.error("COD Order submission error:", error);
        toast({
          title: "Order Placement Failed",
          description: error.message || "An unexpected error occurred. Please check your details and try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else if (formData.paymentMethod === "razorpay") {
      try {
        const razorpayOrderResponse = await createRazorpayOrder({
          amount: getCartTotal(), // Amount in base currency unit (e.g., INR)
          currency: "INR", // Assuming INR
        });

        if (!razorpayOrderResponse.success || !razorpayOrderResponse.orderId || !razorpayOrderResponse.razorpayKeyId) {
          throw new Error(razorpayOrderResponse.error || "Could not create Razorpay order.");
        }
        
        const rzpKeyId = razorpayOrderResponse.razorpayKeyId;

        const options = {
          key: rzpKeyId,
          amount: razorpayOrderResponse.amount, // Amount in paise from Razorpay
          currency: razorpayOrderResponse.currency,
          name: "Xerox2U Store",
          description: "Order Payment",
          image: "https://placehold.co/128x128.png", // Replace with your logo URL
          order_id: razorpayOrderResponse.orderId,
          handler: async function (response: any) {
            // This function is called when payment is successful
            const finalPayload: EcommOrderPayload = {
              ...baseOrderPayload,
              paymentMethod: 'razorpay',
              paymentDetails: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              },
            };
            try {
                await handleFinalOrderSubmission(finalPayload);
            } catch (e: any) {
                toast({ title: "Order Saving Failed", description: e.message, variant: "destructive" });
                // Potentially refund or inform user if DB save fails after payment.
            }
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
          notes: {
            address: `${formData.street}, ${formData.city}, ${formData.postalCode}, ${formData.country}`,
            userId: user?.uid || "guest",
          },
          theme: {
            color: "#2E9AFF", // Your app's primary color
          },
        };

        if (!window.Razorpay) {
          toast({ title: "Payment Gateway Error", description: "Razorpay SDK not loaded. Please refresh.", variant: "destructive"});
          setIsSubmitting(false);
          return;
        }

        const rzpInstance = new window.Razorpay(options);
        rzpInstance.on('payment.failed', function (response: any) {
          console.error("Razorpay payment failed:", response.error);
          toast({
            title: "Payment Failed",
            description: `${response.error.description || response.error.reason || 'An error occurred with the payment.'} (Error: ${response.error.code})`,
            variant: "destructive",
            duration: 7000,
          });
          setIsSubmitting(false); 
        });
        
        rzpInstance.open();
        // Note: setIsSubmitting(false) is handled by rzpInstance.on('payment.failed') or after successful db submission.
        // If the user closes the modal, Razorpay doesn't call the handler or payment.failed immediately.
        // For a robust solution, you might need to listen for modal close events if Razorpay SDK provides them,
        // or handle abandoned payments via webhooks from Razorpay server-side.
        // For now, if modal is closed, isSubmitting remains true until timeout or next action.

      } catch (error: any) {
        console.error("Razorpay flow error:", error);
        toast({
          title: "Payment Initialization Failed",
          description: error.message || "Could not initiate online payment.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
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

      {cartItems.length === 0 ? ( 
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
                  <p className="font-semibold text-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({getItemCount()} items)</span>
                <span>₹{getCartTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="font-medium text-primary">FREE</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-xl text-foreground">
                <span>Total</span>
                <span>₹{getCartTotal().toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </main>
  );
}
