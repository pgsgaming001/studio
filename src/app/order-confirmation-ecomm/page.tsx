
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle, Home, ShoppingBag, Loader2 } from "lucide-react";
import Link from "next/link";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [displayOrderId, setDisplayOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      setDisplayOrderId(orderId);
    }
  }, [orderId]);

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
            Thank you for your purchase from <span className="font-semibold text-primary">Xerox2U Store</span>! 
            Your order is being processed.
          </p>
          {displayOrderId ? (
            <p className="text-muted-foreground text-sm">
              Your Order ID is: <span className="font-semibold text-accent font-code">{displayOrderId.substring(0,12)}...</span>
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">Processing your order details...</p>
          )}
          <p className="text-muted-foreground text-sm">
            A confirmation email with your order details has been sent to your registered email address (this is a placeholder notification).
          </p>
        </CardContent>
        <CardFooter className="bg-secondary/50 p-6 flex flex-col sm:flex-row gap-4">
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Back to Homepage
            </Link>
          </Button>
           <Button asChild variant="outline" className="w-full py-6 text-lg">
            <Link href="/#ecommerce">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Continue Shopping
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


export default function OrderConfirmationEcommPage() {
  // Suspense is required by Next.js when using useSearchParams in client components
  return (
    <React.Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 text-primary animate-spin mb-4" /><p className="text-lg text-muted-foreground">Loading Confirmation...</p></div>}>
      <OrderConfirmationContent />
    </React.Suspense>
  );
}

