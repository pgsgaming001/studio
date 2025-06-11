
"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CreditCard, Loader2, AlertTriangle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, Suspense } from 'react';
import { submitOrderToMongoDB, type OrderFormPayload } from '@/app/actions/submitOrder';
import type { Address } from '@/components/features/xerox/DeliveryAddress';

// Component that uses useSearchParams
function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract order details from query parameters
  const [orderDetails, setOrderDetails] = useState<Partial<OrderFormPayload & {totalCostString: string}>>({});

  useEffect(() => {
    const params: any = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Basic validation
    if (!params.totalCost || !params.deliveryMethod || (params.deliveryMethod === 'home_delivery' && !params.street) ) {
        setError("Essential order details are missing. Please restart the order process.");
        toast({title: "Invalid Order Data", description: "Missing critical details for payment.", variant: "destructive"});
        // router.replace('/'); // Or back to Xerox form
        return;
    }
    
    setOrderDetails({
        fileName: params.fileName,
        numPages: params.numPages,
        numCopies: params.numCopies,
        printColor: params.printColor as 'color' | 'bw',
        paperSize: params.paperSize as 'A4' | 'Letter' | 'Legal',
        printSides: params.printSides as 'single' | 'double',
        layout: params.layout as '1up' | '2up',
        totalCost: parseFloat(params.totalCost),
        deliveryMethod: params.deliveryMethod as 'pickup' | 'home_delivery',
        deliveryAddress: {
            street: params.street || '',
            city: params.city || '',
            state: params.state || '',
            zip: params.zip || '',
            country: params.country || '',
        } as Address,
        userId: params.userId,
        userEmail: params.userEmail,
        userName: params.userName,
    });

  }, [searchParams, router, toast]);


  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setError(null);

    const fileDataUri = sessionStorage.getItem('pendingOrderFileDataUri');
    if (!fileDataUri) {
        toast({title: "File Error", description: "Uploaded file data not found. Please restart order.", variant: "destructive"});
        setIsProcessing(false);
        sessionStorage.removeItem('pendingOrderFileDataUri'); // Clean up
        return;
    }
    
    const payload: OrderFormPayload = {
        fileName: orderDetails.fileName || "Untitled.pdf",
        fileDataUri: fileDataUri, // Retrieve from session storage
        numPages: orderDetails.numPages!,
        numCopies: orderDetails.numCopies!,
        printColor: orderDetails.printColor!,
        paperSize: orderDetails.paperSize!,
        printSides: orderDetails.printSides!,
        layout: orderDetails.layout!,
        totalCost: orderDetails.totalCost!,
        deliveryMethod: orderDetails.deliveryMethod!,
        deliveryAddress: orderDetails.deliveryAddress!,
        userId: orderDetails.userId,
        userEmail: orderDetails.userEmail,
        userName: orderDetails.userName,
    };
    
    try {
      // Simulate payment success
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      
      const result = await submitOrderToMongoDB(payload);
      sessionStorage.removeItem('pendingOrderFileDataUri'); // Clean up on success

      if (result.success && result.orderId && result.pickupCode) {
        toast({ title: "Payment Successful & Order Placed!", description: `Order ID: ${result.orderId.substring(0,8)}...` });
        // For home delivery, pickupCode isn't as relevant on confirmation, but it's generated.
        router.push(`/order-confirmation?orderId=${result.orderId}&pickupCode=${result.pickupCode}&deliveryMethod=home_delivery&amount=${payload.totalCost.toFixed(2)}`);
      } else {
        throw new Error(result.error || "Failed to save order after payment.");
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during payment or order submission.");
      toast({ title: "Payment or Order Failed", description: e.message, variant: "destructive" });
      // Do not remove fileDataUri from session storage on failure, user might retry
    } finally {
      setIsProcessing(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-destructive/10 p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Payment Process Error</h1>
        <p className="text-muted-foreground text-center mb-6 max-w-md">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back & Try Again
        </Button>
      </div>
    );
  }

  if (!orderDetails.totalCost) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg text-muted-foreground">Loading order details...</p>
        </div>
     );
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-xl rounded-xl">
        <CardHeader className="bg-primary/5">
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <CreditCard className="mr-3 h-7 w-7" /> Secure Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <p className="text-center text-muted-foreground">
            You are about to pay for your print order. This is a placeholder payment page.
          </p>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Amount Due:</p>
            <p className="text-4xl font-bold text-accent">
              ₹{orderDetails.totalCost?.toFixed(2) ?? '0.00'}
            </p>
          </div>
          <div className="text-xs text-muted-foreground p-3 bg-secondary/50 rounded-md">
            <h4 className="font-semibold mb-1">Order Summary (Home Delivery):</h4>
            <p>File: {orderDetails.fileName}</p>
            <p>Pages: {orderDetails.numPages}, Copies: {orderDetails.numCopies}</p>
            <p>To: {orderDetails.deliveryAddress?.street}, {orderDetails.deliveryAddress?.city}</p>
          </div>
          
           {/* Placeholder for actual payment form/integration */}
           <div className="text-center p-4 border-2 border-dashed rounded-md border-yellow-500 bg-yellow-50">
                <p className="text-yellow-700 font-medium">
                    Payment Gateway (e.g., Stripe, Razorpay) would be integrated here.
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                    Clicking "Confirm Payment" will simulate a successful transaction.
                </p>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={handleConfirmPayment} 
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6 shadow-md"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-5 w-5" />
            )}
            {isProcessing ? 'Processing Payment...' : 'Confirm Payment (Simulated)'}
          </Button>
          <Button variant="outline" onClick={() => router.back()} className="w-full" disabled={isProcessing}>
             <ArrowLeft className="mr-2 h-4 w-4" /> Cancel & Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Wrap with Suspense because useSearchParams is used
export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col items-center justify-center p-4"><Loader2 className="h-12 w-12 text-primary animate-spin mb-4" /><p className="text-lg text-muted-foreground">Loading Payment Page...</p></div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
    