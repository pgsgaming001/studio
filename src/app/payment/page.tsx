
"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CreditCard, Loader2, AlertTriangle, ArrowLeft, CheckCircle, ShoppingCart, Home, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, Suspense } from 'react';
import { submitOrderToMongoDB, type OrderFormPayload, type RazorpayPaymentDetails } from '@/app/actions/submitOrder';
import type { Address } from '@/components/features/xerox/DeliveryAddress';
import { createRazorpayOrder } from '@/app/actions/createRazorpayOrder';
import { useAuth } from '@/context/AuthContext';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const authContext = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Partial<OrderFormPayload & { totalCost: number }>>({});
  const [fileDataUriForUpload, setFileDataUriForUpload] = useState<string | null>(null);


  useEffect(() => {
    const params: any = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const costParam = params.totalCost;
    const parsedCost = parseFloat(costParam);

    if (!costParam || isNaN(parsedCost) || parsedCost <= 0 || !params.deliveryMethod || !params.userId || !params.userEmail || !params.userName) {
        setError("Essential order details are missing or invalid (e.g. cost is zero or not a number). Please restart the order process.");
        toast({title: "Invalid Order Data", description: "Missing or invalid critical details for payment. Please go back and check your order inputs.", variant: "destructive", duration: 7000});
        setOrderDetails({}); 
        return;
    }

    const storedFileDataUri = sessionStorage.getItem('pendingOrderFileDataUri');
    if (!storedFileDataUri && params.fileName) {
        setError("Uploaded file data not found. Please restart the order process by re-uploading your file.");
        toast({title: "File Error", description: "File data missing. Please re-upload your PDF and complete the form again.", variant: "destructive", duration: 7000});
        setOrderDetails({});
        return;
    }
    setFileDataUriForUpload(storedFileDataUri);

    setOrderDetails({
        fileName: params.fileName || null,
        numPages: params.numPages,
        numCopies: params.numCopies,
        printColor: params.printColor as 'color' | 'bw',
        paperSize: params.paperSize as 'A4' | 'Letter' | 'Legal',
        printSides: params.printSides as 'single' | 'double',
        layout: params.layout as '1up' | '2up',
        totalCost: parsedCost,
        deliveryMethod: params.deliveryMethod as 'pickup' | 'home_delivery',
        deliveryAddress: {
            street: params.street || '',
            city: params.city || '',
            state: params.state || '',
            zip: params.zip || '',
            country: params.country || '',
        } as Address,
        pickupCenter: params.pickupCenter || undefined,
        userId: params.userId,
        userEmail: params.userEmail,
        userName: params.userName,
    });

  }, [searchParams, toast]);


  const handleRazorpayPayment = async () => {
    if (!authContext.user) {
      toast({ title: "Authentication Required", description: "Please sign in to make a payment.", variant: "destructive" });
      return;
    }
    // Double check totalCost validity before proceeding
    if (typeof orderDetails.totalCost !== 'number' || isNaN(orderDetails.totalCost) || orderDetails.totalCost <= 0) {
      toast({ title: "Invalid Amount", description: "Order total is not valid for payment. Please go back and adjust your order.", variant: "destructive" });
      setError("Order total is invalid. Please restart.");
      return;
    }
    if (orderDetails.fileName && !fileDataUriForUpload) {
        toast({title: "File Error", description: "Uploaded file data is missing. Please restart order.", variant: "destructive"});
        setError("File data missing. Re-upload required.");
        return;
    }

    setIsProcessing(true);
    setError(null);
    toast({ title: "Initiating Payment...", description: "Preparing secure payment gateway." });

    try {
      const razorpayOrderResponse = await createRazorpayOrder({
        amount: orderDetails.totalCost, // This amount is already validated to be > 0
        currency: "INR",
      });

      if (!razorpayOrderResponse.success || !razorpayOrderResponse.orderId || !razorpayOrderResponse.razorpayKeyId) {
        throw new Error(razorpayOrderResponse.error || "Could not create Razorpay order.");
      }

      const rzpKeyId = razorpayOrderResponse.razorpayKeyId;

      const options = {
        key: rzpKeyId,
        amount: razorpayOrderResponse.amount,
        currency: razorpayOrderResponse.currency,
        name: "Xerox2U Print Service",
        description: `Order for ${orderDetails.fileName || 'document print'}`,
        order_id: razorpayOrderResponse.orderId,
        handler: async function (response: RazorpayPaymentDetails) {

          const finalPayload: OrderFormPayload = {
            ...(orderDetails as OrderFormPayload),
            fileDataUri: fileDataUriForUpload,
            paymentMethod: 'razorpay',
            paymentDetails: {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            },
          };

          try {
            const submissionResult = await submitOrderToMongoDB(finalPayload);
            sessionStorage.removeItem('pendingOrderFileDataUri');

            if (submissionResult.success && submissionResult.orderId) {
              toast({ title: "Payment Successful & Order Placed!", description: `Order ID: ${submissionResult.orderId.substring(0,8)}...` });

              const queryParams = new URLSearchParams({
                orderId: submissionResult.orderId,
                deliveryMethod: orderDetails.deliveryMethod!,
                amount: orderDetails.totalCost!.toFixed(2) // orderDetails.totalCost is now guaranteed positive
              });
              if (orderDetails.deliveryMethod === 'pickup' && submissionResult.pickupCode) {
                queryParams.set('pickupCode', submissionResult.pickupCode);
                queryParams.set('pickupCenter', encodeURIComponent(orderDetails.pickupCenter || "N/A"));
              }
              router.push(`/order-confirmation?${queryParams.toString()}`);

            } else {
              throw new Error(submissionResult.error || "Failed to save order after payment.");
            }
          } catch (e: any) {
            setError(e.message || "Order submission failed after payment.");
            toast({ title: "Order Submission Failed", description: e.message, variant: "destructive" });
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: orderDetails.userName,
          email: orderDetails.userEmail,
        },
        notes: {
          userId: orderDetails.userId,
          fileName: orderDetails.fileName,
          deliveryMethod: orderDetails.deliveryMethod,
        },
        theme: {
          color: "#2E9AFF",
        },
      };

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded. Please refresh and try again.");
      }
      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (response: any) {
        console.error("Razorpay payment failed:", response.error);
        toast({
          title: "Payment Failed",
          description: `${response.error.description || response.error.reason || 'An error occurred.'} (Error: ${response.error.code})`,
          variant: "destructive",
          duration: 7000,
        });
        setIsProcessing(false);
      });
      rzpInstance.open();

    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
      toast({ title: "Payment Initialization Failed", description: e.message, variant: "destructive" });
      setIsProcessing(false);
    }
  };

  if (authContext.loading || (Object.keys(orderDetails).length === 0 && !error)) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg text-muted-foreground">Loading order details...</p>
        </div>
     );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-destructive/10 p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Payment Process Error</h1>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back & Adjust Order
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-xl rounded-xl">
        <CardHeader className="bg-primary/5">
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <CreditCard className="mr-3 h-7 w-7" /> Secure Payment for Print Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <p className="text-center text-muted-foreground">
            Review your order details and proceed to payment.
          </p>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Amount Due:</p>
            <p className="text-4xl font-bold text-accent">
              ₹{orderDetails.totalCost?.toFixed(2) ?? '0.00'}
            </p>
          </div>
          <div className="text-xs text-muted-foreground p-3 bg-secondary/50 rounded-md space-y-1">
            <h4 className="font-semibold mb-1">Order Summary:</h4>
            {orderDetails.fileName && <p className="truncate">File: {orderDetails.fileName}</p>}
            <p>Pages: {orderDetails.numPages}, Copies: {orderDetails.numCopies}</p>
            <p>Type: {orderDetails.printColor}, {orderDetails.paperSize}, {orderDetails.printSides}, {orderDetails.layout}</p>
             {orderDetails.deliveryMethod === 'home_delivery' && orderDetails.deliveryAddress && (
              <p className="flex items-center gap-1"><Home size={14}/> Deliver to: {orderDetails.deliveryAddress.street}, {orderDetails.deliveryAddress.city}</p>
            )}
            {orderDetails.deliveryMethod === 'pickup' && orderDetails.pickupCenter && (
              <p className="flex items-center gap-1"><Package size={14}/> Pickup at: {orderDetails.pickupCenter}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            onClick={handleRazorpayPayment}
            disabled={isProcessing || !authContext.user || typeof orderDetails.totalCost !== 'number' || isNaN(orderDetails.totalCost) || orderDetails.totalCost <= 0 || (!!orderDetails.fileName && !fileDataUriForUpload)}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6 shadow-md"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-5 w-5" />
            )}
            {isProcessing ? 'Processing Payment...' : 'Pay Securely with Razorpay'}
          </Button>
          <Button variant="outline" onClick={() => router.back()} className="w-full" disabled={isProcessing}>
             <ArrowLeft className="mr-2 h-4 w-4" /> Modify Order
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col items-center justify-center p-4"><Loader2 className="h-12 w-12 text-primary animate-spin mb-4" /><p className="text-lg text-muted-foreground">Loading Payment Page...</p></div>}>
      <PaymentPageContent />
    </Suspense>
  );
}
