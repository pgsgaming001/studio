
"use client";


import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CreditCard, Loader2, AlertTriangle, ArrowLeft, CheckCircle, Home, Package, Info, FileText, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect, useState, Suspense } from 'react';
import { submitOrderToMongoDB, type OrderFormPayload, type RazorpayPaymentDetails } from '@/app/actions/submitOrder';
import type { Address } from '@/components/features/xerox/DeliveryAddress';
import { createRazorpayOrder } from '@/app/actions/createRazorpayOrder';
import { useAuth } from '@/context/AuthContext';
import type { ServiceType, PhotoType } from '@/components/features/xerox/XeroxForm';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const MINIMUM_ORDER_AMOUNT = 1.00; // Minimum ₹1.00

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const authContext = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Partial<OrderFormPayload & { totalCost: number }>>({
    serviceType: 'document', 
    fileName: null,
    numCopies: "1",
    printColor: 'bw', // Default for documents, will be 'color' for photos
    totalCost: 0,
    deliveryMethod: 'pickup',
    numPages: "1",
    paperSize: 'A4',
    printSides: 'single',
    layout: '1up',
    photoType: '4x6_inch',
  });
  const [fileDataUriForUpload, setFileDataUriForUpload] = useState<string | null>(null);


  useEffect(() => {
    const params: any = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    console.log("PaymentPage: Received query parameters:", params);

    const costParam = params.totalCost;
    const parsedCost = parseFloat(costParam);
    console.log(`PaymentPage: Raw totalCost from URL: '${costParam}', Parsed: ${parsedCost}`);


    if (!costParam || isNaN(parsedCost) || parsedCost <= 0) {
        const errorMsg = `Essential order details are missing or invalid. Total cost received: '${costParam}'. Please restart the order process.`;
        console.error("PaymentPage: Invalid Order Data - ", errorMsg);
        setError(errorMsg);
        toast({title: "Invalid Order Data", description: "Missing or invalid critical details for payment. Please go back and check your order inputs.", variant: "destructive", duration: 7000});
        setOrderDetails(prev => ({ ...prev, totalCost: 0 })); 
        return;
    }

    if (parsedCost < MINIMUM_ORDER_AMOUNT) {
        const errorMsg = `Order total (₹${parsedCost.toFixed(2)}) is below the minimum required amount of ₹${MINIMUM_ORDER_AMOUNT.toFixed(2)}. Please adjust your order.`;
        console.warn("PaymentPage: Order amount too low - ", errorMsg);
        setError(errorMsg); 
        toast({title: "Order Amount Too Low", description: errorMsg, variant: "destructive", duration: 10000});
        setOrderDetails(prev => ({ ...prev, totalCost: parsedCost })); 
        return;
    }

    const storedFileDataUri = sessionStorage.getItem('pendingOrderFileDataUri');
    if (!storedFileDataUri && params.fileName) {
        const errorMsg = "Uploaded file data not found. Please restart the order process by re-uploading your file.";
        console.error("PaymentPage: File Error - ", errorMsg);
        setError(errorMsg);
        toast({title: "File Error", description: "File data missing. Please re-upload your PDF/image and complete the form again.", variant: "destructive", duration: 7000});
        setOrderDetails(prev => ({ ...prev, totalCost: 0 })); 
        return;
    }
    setFileDataUriForUpload(storedFileDataUri);

    setError(null); 
    setOrderDetails({
        serviceType: params.serviceType as ServiceType || 'document',
        fileName: params.fileName || null,
        numCopies: params.numCopies || "1", // For docs: sets; for passport: individual photos; for 4x6: prints
        printColor: params.serviceType === 'photo' ? 'color' : (params.printColor as 'color' | 'bw' || 'bw'), // Photos always color
        totalCost: parsedCost,
        deliveryMethod: params.deliveryMethod as 'pickup' | 'home_delivery' || 'pickup',
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
        numPages: params.serviceType === 'document' ? params.numPages : undefined,
        paperSize: params.serviceType === 'document' ? params.paperSize as 'A4' | 'Letter' | 'Legal' : undefined,
        printSides: params.serviceType === 'document' ? params.printSides as 'single' | 'double' : undefined,
        layout: params.serviceType === 'document' ? params.layout as '1up' | '2up' : undefined,
        photoType: params.serviceType === 'photo' ? params.photoType as PhotoType : undefined,
    });
    console.log("PaymentPage: Order details successfully initialized from query params:", { serviceType: params.serviceType, totalCost: parsedCost, deliveryMethod: params.deliveryMethod });

  }, [searchParams, toast]);


  const handleRazorpayPayment = async () => {
    console.log("PaymentPage: handleRazorpayPayment initiated.");
    if (!authContext.user) {
      toast({ title: "Authentication Required", description: "Please sign in to make a payment.", variant: "destructive" });
      return;
    }

    if (typeof orderDetails.totalCost !== 'number' || isNaN(orderDetails.totalCost) || orderDetails.totalCost < MINIMUM_ORDER_AMOUNT) {
      const errorMsg = `Order total (₹${orderDetails.totalCost?.toFixed(2) || 'N/A'}) is not valid or below minimum of ₹${MINIMUM_ORDER_AMOUNT.toFixed(2)}. Please adjust your order.`;
      console.error("PaymentPage: Invalid or low amount for payment - ", errorMsg);
      setError(errorMsg);
      toast({ title: "Invalid Amount", description: errorMsg, variant: "destructive" });
      setIsProcessing(false); 
      return;
    }
    if (orderDetails.fileName && !fileDataUriForUpload) {
        const errorMsg = "Uploaded file data is missing. Please restart order.";
        console.error("PaymentPage: File Error - ", errorMsg);
        setError(errorMsg);
        toast({title: "File Error", description: errorMsg, variant: "destructive"});
        setIsProcessing(false); 
        return;
    }

    setIsProcessing(true);
    setError(null); 
    toast({ title: "Initiating Payment...", description: "Preparing secure payment gateway." });
    console.log("PaymentPage: Attempting to create Razorpay order with amount:", orderDetails.totalCost);

    try {
      const razorpayOrderResponse = await createRazorpayOrder({
        amount: orderDetails.totalCost, 
        currency: "INR", 
      });
      console.log("PaymentPage: createRazorpayOrder response:", razorpayOrderResponse);

      if (!razorpayOrderResponse.success || !razorpayOrderResponse.orderId || !razorpayOrderResponse.razorpayKeyId) {
        const serverErrorMsg = razorpayOrderResponse.error || "Could not create Razorpay order. Ensure keys are set and amount is valid.";
        throw new Error(serverErrorMsg);
      }

      if (!window.Razorpay) {
        console.error("PaymentPage: Razorpay SDK (window.Razorpay) is not loaded.");
        throw new Error("Payment gateway (Razorpay SDK) not loaded. Please refresh the page or check your internet connection.");
      }
      
      const rzpKeyId = razorpayOrderResponse.razorpayKeyId;

      const options = {
        key: rzpKeyId,
        amount: razorpayOrderResponse.amount, 
        currency: razorpayOrderResponse.currency,
        name: `Xerox2U ${orderDetails.serviceType === 'document' ? 'Print' : 'Photo'} Service`,
        description: `Order for ${orderDetails.fileName || (orderDetails.serviceType === 'document' ? 'document print' : 'photo print')}`,
        order_id: razorpayOrderResponse.orderId,
        handler: async function (response: RazorpayPaymentDetails) {
          console.log("PaymentPage: Razorpay payment successful. Response:", response);
          
          const finalPayload: OrderFormPayload = {
            ...(orderDetails as OrderFormPayload), 
            fileDataUri: fileDataUriForUpload,
            paymentMethod: 'razorpay', 
            paymentDetails: {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            },
            printColor: orderDetails.serviceType === 'photo' ? 'color' : orderDetails.printColor!, // Photos always color
          };
          
          if (orderDetails.serviceType === 'document') {
            finalPayload.photoType = undefined;
          } else {
            finalPayload.numPages = undefined;
            finalPayload.paperSize = undefined;
            finalPayload.printSides = undefined;
            finalPayload.layout = undefined;
          }


          try {
            console.log("PaymentPage: Submitting order to MongoDB with payload:", {...finalPayload, fileDataUri: finalPayload.fileDataUri ? 'PRESENT' : 'ABSENT'});
            const submissionResult = await submitOrderToMongoDB(finalPayload);
            console.log("PaymentPage: MongoDB submission result:", submissionResult);
            

            if (submissionResult.success && submissionResult.orderId) {
              sessionStorage.removeItem('pendingOrderFileDataUri'); 
              toast({ title: "Payment Successful & Order Placed!", description: `Order ID: ${submissionResult.orderId.substring(0,8)}...` });

              const queryParams = new URLSearchParams({
                orderId: submissionResult.orderId,
                deliveryMethod: orderDetails.deliveryMethod!,
                amount: orderDetails.totalCost!.toFixed(2),
                serviceType: orderDetails.serviceType!
              });
              if (orderDetails.deliveryMethod === 'pickup' && submissionResult.pickupCode) {
                queryParams.set('pickupCode', submissionResult.pickupCode);
                queryParams.set('pickupCenter', encodeURIComponent(orderDetails.pickupCenter || "N/A"));
              }
              router.push(`/order-confirmation?${queryParams.toString()}`);

            } else {
              let detailedError = submissionResult.error || "Failed to save order after payment. Please contact support.";
              if (submissionResult.error && submissionResult.error.includes("storage/unauthorized")) {
                  detailedError = `Order data could not be saved due to a file permission error. This often means the storage security rules in your Firebase project need adjustment to allow uploads for authenticated users (e.g., allow write: if request.auth != null && request.auth.uid == userId; on the 'user_uploads/{userId}/*' path). Please check your Firebase Storage rules in the Firebase Console. Original error: ${submissionResult.error}`;
              }
              throw new Error(detailedError);
            }
          } catch (e: any) {
            console.error("PaymentPage: Order submission to MongoDB failed after payment:", e);
            setError(e.message || "Order submission failed after successful payment. Contact support.");
            toast({ title: "Order Submission Failed Post-Payment", description: e.message, variant: "destructive", duration: 15000 });
          } finally {
            setIsProcessing(false); 
          }
        },
        prefill: {
          name: orderDetails.userName || '',
          email: orderDetails.userEmail || '',
        },
        notes: {
          userId: orderDetails.userId || 'guest',
          fileName: orderDetails.fileName || 'N/A',
          serviceType: orderDetails.serviceType || 'N/A',
          deliveryMethod: orderDetails.deliveryMethod || 'N/A',
        },
        theme: {
          color: "#2E9AFF", 
        },
      };

      console.log("PaymentPage: Razorpay options for modal:", options);
      const rzpInstance = new window.Razorpay(options);

      rzpInstance.on('payment.failed', function (response: any) {
        console.error("PaymentPage: Razorpay payment.failed event. Response:", response.error);
        const errorCode = response.error?.code;
        const errorDescription = response.error?.description || "Payment failed.";
        const errorReason = response.error?.reason || "Unknown reason.";
        
        const detailedErrorMsg = `${errorDescription} (Reason: ${errorReason}, Code: ${errorCode})`;
        console.error("Detailed Razorpay failure:", detailedErrorMsg);

        setError(detailedErrorMsg);
        toast({
          title: "Payment Failed",
          description: errorDescription, 
          variant: "destructive",
          duration: 10000,
        });
        setIsProcessing(false); 
      });
      
      rzpInstance.open();
      console.log("PaymentPage: Razorpay modal opened.");

    } catch (e: any) {
      console.error("PaymentPage: Error in handleRazorpayPayment (catch block):", e);
      setError(e.message || "An unexpected error occurred during payment initiation.");
      toast({ title: "Payment Initialization Failed", description: e.message, variant: "destructive", duration: 8000 });
      setIsProcessing(false); 
    }
  };
  
  const isButtonDisabled = isProcessing || 
                         !authContext.user || 
                         typeof orderDetails.totalCost !== 'number' || 
                         isNaN(orderDetails.totalCost) || 
                         orderDetails.totalCost < MINIMUM_ORDER_AMOUNT || 
                         (!!orderDetails.fileName && !fileDataUriForUpload) || 
                         !!error; 

  if (authContext.loading || (Object.keys(orderDetails).length === 0 && !error && typeof window !== 'undefined' && !orderDetails.totalCost)) { 
     return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg text-muted-foreground">Loading order details...</p>
        </div>
     );
  }

  if (error && (!orderDetails.totalCost || (orderDetails.fileName && !fileDataUriForUpload) || (orderDetails.totalCost && orderDetails.totalCost < MINIMUM_ORDER_AMOUNT))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-destructive/10 p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Payment Error</h1>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back & Adjust Order
        </Button>
      </div>
    );
  }
  
  const displayTotalCost = typeof orderDetails.totalCost === 'number' ? orderDetails.totalCost.toFixed(2) : '0.00';
  const serviceNameDisplay = orderDetails.serviceType === 'document' ? "Document Print" : "Photo Print";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-xl rounded-xl">
        <CardHeader className="bg-primary/5">
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <CreditCard className="mr-3 h-7 w-7" /> Secure Payment for {serviceNameDisplay} Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <p className="text-center text-muted-foreground">
            Review your order details and proceed to payment.
          </p>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Amount Due:</p>
            <p className={`text-4xl font-bold ${typeof orderDetails.totalCost === 'number' && orderDetails.totalCost < MINIMUM_ORDER_AMOUNT ? 'text-destructive' : 'text-accent'}`}>
              ₹{displayTotalCost}
            </p>
             {typeof orderDetails.totalCost === 'number' && orderDetails.totalCost < MINIMUM_ORDER_AMOUNT && (
                <p className="text-xs text-destructive mt-1">
                    Order total is below the minimum of ₹{MINIMUM_ORDER_AMOUNT.toFixed(2)}.
                </p>
            )}
          </div>
          <div className="text-xs text-muted-foreground p-3 bg-secondary/50 rounded-md space-y-1">
            <h4 className="font-semibold mb-1">Order Summary:</h4>
            {orderDetails.fileName && <p className="truncate flex items-center gap-1">{orderDetails.serviceType === 'document' ? <FileText size={14}/> : <Camera size={14}/>} File: {orderDetails.fileName}</p>}
            
            {orderDetails.serviceType === 'document' && (
              <>
                <p>Pages: {orderDetails.numPages || 'N/A'}, Copies: {orderDetails.numCopies || 'N/A'}</p>
                <p>Type: {orderDetails.printColor || 'N/A'}, {orderDetails.paperSize || 'N/A'}, {orderDetails.printSides || 'N/A'}, {orderDetails.layout || 'N/A'}</p>
              </>
            )}
            {orderDetails.serviceType === 'photo' && (
              <>
                <p>Photo Type: {orderDetails.photoType === '4x6_inch' ? '4x6 Inch (Color)' : 'Passport Photos (Color)'}</p>
                <p>Number of {orderDetails.photoType === 'passport' ? 'Individual Photos' : '4x6 Prints'}: {orderDetails.numCopies || 'N/A'}</p>
              </>
            )}

             {orderDetails.deliveryMethod === 'home_delivery' && orderDetails.deliveryAddress && (
              <p className="flex items-center gap-1"><Home size={14}/> Deliver to: {orderDetails.deliveryAddress.street || 'N/A'}, {orderDetails.deliveryAddress.city || 'N/A'}</p>
            )}
            {orderDetails.deliveryMethod === 'pickup' && orderDetails.pickupCenter && (
              <p className="flex items-center gap-1"><Package size={14}/> Pickup at: {orderDetails.pickupCenter}</p>
            )}
          </div>
          {error && (typeof orderDetails.totalCost === 'number' && orderDetails.totalCost >= MINIMUM_ORDER_AMOUNT) && ( 
            <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-md text-sm text-destructive text-center flex items-center justify-center gap-2">
                <Info size={16} className="shrink-0" /> <span>{error}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            onClick={handleRazorpayPayment}
            disabled={isButtonDisabled} 
            className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6 shadow-md"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-5 w-5" />
            )}
            {isProcessing ? 'Processing Payment...' : `Pay Securely ₹${displayTotalCost}`}
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
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Loading Payment Page...</p>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}


