
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle, Home, ShoppingBag, Ticket, Truck, Loader2 } from "lucide-react";
import Link from "next/link";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState({
    orderId: '',
    pickupCode: '',
    deliveryMethod: '',
    pickupCenter: '',
    amount: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    const pickupCode = searchParams.get("pickupCode");
    const deliveryMethod = searchParams.get("deliveryMethod");
    const pickupCenter = searchParams.get("pickupCenter");
    const amount = searchParams.get("amount"); // For home delivery total

    if (orderId) {
      setOrderDetails({
        orderId,
        pickupCode: pickupCode || "N/A",
        deliveryMethod: deliveryMethod || "N/A",
        pickupCenter: pickupCenter ? decodeURIComponent(pickupCenter) : "N/A",
        amount: amount || "N/A",
      });
    }
    setIsLoading(false);
  }, [searchParams]);

  if (isLoading) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg text-muted-foreground">Loading Confirmation...</p>
        </div>
     );
  }
  
  if (!orderDetails.orderId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl rounded-xl">
          <CardHeader className="text-center bg-destructive/10 p-8">
            <CardTitle className="font-headline text-3xl md:text-4xl text-destructive">Invalid Order</CardTitle>
          </CardHeader>
          <CardContent className="text-center p-8">
            <p className="text-muted-foreground text-base">
              Order details could not be found. Please check your email or contact support if this issue persists.
            </p>
          </CardContent>
           <CardFooter className="bg-secondary/50 p-6">
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg">
                <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Back to Homepage
                </Link>
            </Button>
            </CardFooter>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-lg shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-primary/5 p-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 ring-4 ring-green-200">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="font-headline text-3xl md:text-4xl text-primary">Order Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 p-8">
          <p className="text-muted-foreground text-base">
            Thank you for your order with <span className="font-semibold text-primary">Xerox2U Print Service</span>.
          </p>
          <div className="border-t border-b py-4 space-y-2">
            <p className="text-sm">Order ID: <span className="font-semibold font-mono text-accent">{orderDetails.orderId.substring(0,12)}...</span></p>
            
            {orderDetails.deliveryMethod === 'pickup' && (
              <>
                <p className="text-lg font-bold">Your Pickup Code: 
                  <span className="ml-2 inline-flex items-center bg-accent text-accent-foreground px-3 py-1 rounded-md text-xl shadow">
                    <Ticket className="mr-2 h-5 w-5" /> {orderDetails.pickupCode}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Use this code when collecting your prints from <span className="font-semibold">{orderDetails.pickupCenter}</span>.
                </p>
              </>
            )}
            {orderDetails.deliveryMethod === 'home_delivery' && (
               <>
                <p className="text-sm text-muted-foreground flex items-center justify-center">
                    <Truck className="mr-2 h-5 w-5 text-primary" /> Your order will be delivered to your address.
                </p>
                <p className="text-sm">Total Amount: <span className="font-semibold text-accent">₹{parseFloat(orderDetails.amount).toFixed(2)}</span></p>
               </>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            A confirmation email has been sent (placeholder). You can also track your order status in "My Orders".
          </p>
        </CardContent>
        <CardFooter className="bg-secondary/50 p-6 flex flex-col sm:flex-row gap-3">
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Back to Homepage
            </Link>
          </Button>
           <Button asChild variant="outline" className="w-full py-6 text-lg">
            <Link href="/my-orders">
              <ShoppingBag className="mr-2 h-5 w-5" />
              View My Orders
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Loading Confirmation Details...</p>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
    