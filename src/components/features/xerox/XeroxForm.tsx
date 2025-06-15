
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "./FileUpload";
import { PrintSettings } from "./PrintSettings";
import type { Address } from "./DeliveryAddress";
import { DeliveryAddress } from "./DeliveryAddress";
import { OrderSummary } from "./OrderSummary";
import { PrintPreview } from "./PrintPreview";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument } from 'pdf-lib';
import { useAuth } from "@/context/AuthContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, CreditCard, ArrowRight, ArrowLeft, PackageCheck, UserCheck } from "lucide-react";

export type PageCountStatus = 'idle' | 'processing' | 'detected' | 'error';
export type SubmissionStatus = 'idle' | 'preparing' | 'navigating' | 'success' | 'error';
type DeliveryMethod = 'pickup' | 'home_delivery';
type XeroxFormStep = 'upload_settings' | 'delivery_method' | 'delivery_details' | 'summary_payment';

const PICKUP_CENTERS = ["Tenkasi Main Office", "Madurai Branch", "Chennai Hub"];
const DELIVERY_CHARGE = 40;
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

function arrayBufferToDataUri(buffer: ArrayBuffer, mimeType: string): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

export default function XeroxForm() {
  const router = useRouter();
  const { toast } = useToast();
  const authContext = useAuth();

  const [currentStep, setCurrentStep] = useState<XeroxFormStep>('upload_settings');

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);

  const [numPagesStr, setNumPagesStr] = useState<string>("1");
  const [numCopiesStr, setNumCopiesStr] = useState<string>("1");
  const [pageCountStatus, setPageCountStatus] = useState<PageCountStatus>('idle');

  const [printColor, setPrintColor] = useState<'color' | 'bw'>('bw');
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
  const [printSides, setPrintSides] = useState<'single' | 'double'>('single');
  const [layout, setLayout] = useState<'1up' | '2up'>('1up');

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup');
  const [selectedPickupCenter, setSelectedPickupCenter] = useState<string>(PICKUP_CENTERS[0] || "");
  const [homeDeliveryAddress, setHomeDeliveryAddress] = useState<Address>({
    street: "", city: "", state: "", zip: "", country: "India",
  });

  const [printCost, setPrintCost] = useState<number>(0);
  const [actualDeliveryFee, setActualDeliveryFee] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formSubmissionStatus, setFormSubmissionStatus] = useState<SubmissionStatus>('idle');


  const handleFileChange = async (selectedFile: File | null) => {
    if (!authContext.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in with Google to upload a file.",
        variant: "destructive",
      });
      setFile(null); setFileName(null); setFileDataUri(null); setPageCountStatus('idle');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : null);
    setFileDataUri(null);

    if (selectedFile) {
      if (selectedFile.size > MAX_PDF_SIZE_BYTES) {
        toast({
          title: "File Too Large",
          description: `PDF exceeds 10MB. Max: ${(MAX_PDF_SIZE_BYTES / (1024*1024)).toFixed(0)}MB. Yours: ${(selectedFile.size / (1024*1024)).toFixed(2)} MB.`,
          variant: "destructive",
        });
        setFile(null); setFileName(null); setPageCountStatus('idle'); setNumPagesStr("1");
        return;
      }
      setPageCountStatus('processing'); setNumPagesStr("");
      toast({ title: "Processing PDF...", description: "Detecting page count..." });
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pageCount = pdfDoc.getPageCount();
        setNumPagesStr(pageCount.toString());
        setPageCountStatus('detected');
        setFileDataUri(arrayBufferToDataUri(arrayBuffer, selectedFile.type));
        toast({ title: "PDF Processed", description: `${pageCount} page(s) found. File ready.` });
      } catch (error) {
        console.error("Failed to process PDF:", error);
        setNumPagesStr("1"); setPageCountStatus('error'); setFileDataUri(null);
        toast({ title: "PDF Error", description: "Could not read PDF. Try another or enter page count manually.", variant: "destructive" });
      }
    } else {
      setNumPagesStr("1"); setPageCountStatus('idle'); setFileDataUri(null);
    }
  };

  const calculateCost = useCallback(() => {
    const numP = parseInt(numPagesStr);
    const numC = parseInt(numCopiesStr);

    if (isNaN(numP) || numP <= 0 || isNaN(numC) || numC <= 0 || pageCountStatus === 'processing') {
      setPrintCost(0); return;
    }
    let costPerPage = printColor === 'color' ? 0.50 : 0.10;
    const paperSizeMultipliers: Record<typeof paperSize, number> = { A4: 1.0, Letter: 1.0, Legal: 1.2 };
    costPerPage *= paperSizeMultipliers[paperSize];
    let currentPrintCost = numP * costPerPage * numC;
    if (printSides === 'double') currentPrintCost *= 0.9;
    setPrintCost(currentPrintCost);
  }, [numPagesStr, numCopiesStr, printColor, paperSize, printSides, pageCountStatus]);

  useEffect(() => {
    calculateCost();
  }, [calculateCost]);

  useEffect(() => {
    const currentDeliveryFee = deliveryMethod === 'home_delivery' ? DELIVERY_CHARGE : 0;
    setActualDeliveryFee(currentDeliveryFee);
    setTotalCost(printCost + currentDeliveryFee);
  }, [printCost, deliveryMethod]);

  const validateStep1_UploadSettings = () => {
    if (!authContext.user) return false;
    const numP = parseInt(numPagesStr);
    const isFileValid = !!file && !!fileDataUri;
    return isFileValid && !isNaN(numP) && numP > 0 && pageCountStatus !== 'processing';
  };

  const validateStep3_DeliveryDetails = () => {
    if (!authContext.user) return false;
    if (deliveryMethod === 'pickup') return !!selectedPickupCenter;
    if (deliveryMethod === 'home_delivery') {
      return homeDeliveryAddress.street.trim() !== "" &&
             homeDeliveryAddress.city.trim() !== "" &&
             homeDeliveryAddress.state.trim() !== "" &&
             homeDeliveryAddress.zip.trim() !== "" &&
             homeDeliveryAddress.country.trim() !== "";
    }
    return false;
  };

  const handleNextStep = () => {
    if (!authContext.user) {
      toast({ title: "Authentication Required", description: "Please sign in to proceed.", variant: "destructive" });
      return;
    }
    if (currentStep === 'upload_settings' && validateStep1_UploadSettings()) setCurrentStep('delivery_method');
    else if (currentStep === 'delivery_method') setCurrentStep('delivery_details');
    else if (currentStep === 'delivery_details' && validateStep3_DeliveryDetails()) setCurrentStep('summary_payment');
    else if (currentStep === 'upload_settings' && !validateStep1_UploadSettings()) {
       toast({ title: "Incomplete Information", description: "Please upload a valid PDF and ensure page count is set.", variant: "destructive" });
    } else if (currentStep === 'delivery_details' && !validateStep3_DeliveryDetails()){
       toast({ title: "Incomplete Delivery Information", description: "Please complete the delivery or pickup details.", variant: "destructive" });
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'summary_payment') setCurrentStep('delivery_details');
    else if (currentStep === 'delivery_details') setCurrentStep('delivery_method');
    else if (currentStep === 'delivery_method') setCurrentStep('upload_settings');
  };

  const proceedToPaymentPage = () => {
    if (!authContext.user) {
        toast({ title: "Authentication Required", description: "Please sign in to proceed.", variant: "destructive" });
        return;
    }
    if (!validateStep1_UploadSettings() || !validateStep3_DeliveryDetails()) {
        toast({ title: "Incomplete Information", description: "Please ensure all previous steps are complete.", variant: "destructive" });
        return;
    }
    if (!fileDataUri) {
        toast({ title: "File Error", description: "File data is missing. Please re-upload your PDF.", variant: "destructive" });
        return;
    }
     if (isNaN(totalCost) || totalCost <= 0) {
        toast({ title: "Invalid Order Total", description: "Cannot proceed with zero or invalid cost. Please review settings.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    setFormSubmissionStatus('navigating');
    toast({ title: "Proceeding to Secure Payment", description: "All print orders require online payment. Redirecting..." });

    const queryParams = new URLSearchParams({
        fileName: fileName || "Untitled.pdf",
        numPages: numPagesStr,
        numCopies: numCopiesStr,
        printColor,
        paperSize,
        printSides,
        layout,
        totalCost: totalCost.toString(),
        deliveryMethod,
        userId: authContext.user.uid,
        userEmail: authContext.user.email || '',
        userName: authContext.user.displayName || '',
    });

    if (deliveryMethod === 'home_delivery') {
        queryParams.set('street', homeDeliveryAddress.street);
        queryParams.set('city', homeDeliveryAddress.city);
        queryParams.set('state', homeDeliveryAddress.state);
        queryParams.set('zip', homeDeliveryAddress.zip);
        queryParams.set('country', homeDeliveryAddress.country);
    } else if (deliveryMethod === 'pickup') {
        queryParams.set('pickupCenter', selectedPickupCenter);
    }

    sessionStorage.setItem('pendingOrderFileDataUri', fileDataUri);
    router.push(`/payment?${queryParams.toString()}`);
  };


  const getStepTitle = () => {
    switch(currentStep) {
      case 'upload_settings': return "1. Upload & Print Settings";
      case 'delivery_method': return "2. Delivery Method";
      case 'delivery_details': return `3. ${deliveryMethod === 'pickup' ? 'Pickup Details' : 'Delivery Address'}`;
      case 'summary_payment': return "4. Summary & Proceed to Payment";
      default: return "Print Service";
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
       <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary/5">
          <CardTitle className="font-headline text-2xl text-primary">{getStepTitle()}</CardTitle>
           {!authContext.user && currentStep === 'upload_settings' && (
            <CardDescription className="text-destructive font-medium">
                Please sign in with Google to upload files and place an order.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {currentStep === 'upload_settings' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FileUpload
                    onFileChange={handleFileChange}
                    fileName={fileName}
                    isAuthenticated={!!authContext.user}
                />
                {file && authContext.user && (
                  <PrintSettings
                    numPages={numPagesStr} setNumPages={setNumPagesStr}
                    pageCountStatus={pageCountStatus}
                    numCopies={numCopiesStr} setNumCopies={setNumCopiesStr}
                    printColor={printColor} setPrintColor={setPrintColor}
                    paperSize={paperSize} setPaperSize={setPaperSize}
                    printSides={printSides} setPrintSides={setPrintSides}
                    layout={layout} setLayout={setLayout}
                  />
                )}
              </div>
              <div>
                {file && authContext.user && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-accent">
                        Schematic Preview
                      </CardTitle>
                      <CardDescription>
                        First physical sheet layout.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PrintPreview
                        fileName={fileName}
                        numPages={numPagesStr}
                        printSides={printSides}
                        layout={layout}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {currentStep === 'delivery_method' && (
            <div className="space-y-4">
              <Label className="text-lg font-medium">Choose your delivery option:</Label>
              <RadioGroup value={deliveryMethod} onValueChange={(val) => setDeliveryMethod(val as DeliveryMethod)} className="space-y-2">
                <Label htmlFor="pickup" className="flex items-center space-x-2 p-3 border rounded-md hover:bg-secondary/50 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <span>Pickup from Center (Free)</span>
                </Label>
                <Label htmlFor="home_delivery" className="flex items-center space-x-2 p-3 border rounded-md hover:bg-secondary/50 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                  <RadioGroupItem value="home_delivery" id="home_delivery" />
                  <span>Home Delivery (+₹{DELIVERY_CHARGE.toFixed(2)})</span>
                </Label>
              </RadioGroup>
            </div>
          )}

          {currentStep === 'delivery_details' && deliveryMethod === 'pickup' && (
            <div className="space-y-4">
              <Label htmlFor="pickup-center" className="text-lg font-medium">Select Pickup Center:</Label>
              <Select value={selectedPickupCenter} onValueChange={setSelectedPickupCenter}>
                <SelectTrigger id="pickup-center">
                  <SelectValue placeholder="Choose a center" />
                </SelectTrigger>
                <SelectContent>
                  {PICKUP_CENTERS.map(center => (
                    <SelectItem key={center} value={center}>{center}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">You'll receive a unique code to collect your prints.</p>
            </div>
          )}

          {currentStep === 'delivery_details' && deliveryMethod === 'home_delivery' && (
             <div className="space-y-4">
                <Label className="text-lg font-medium">Enter Your Delivery Address:</Label>
                <DeliveryAddress address={homeDeliveryAddress} setAddress={setHomeDeliveryAddress} />
            </div>
          )}

          {currentStep === 'summary_payment' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-accent">Order Summary</h3>
                <OrderSummary printCost={printCost} deliveryFee={actualDeliveryFee} />
              </div>

              {deliveryMethod === 'pickup' && selectedPickupCenter && (
                <p className="text-sm">Pickup from: <span className="font-medium">{selectedPickupCenter}</span>.</p>
              )}
               {deliveryMethod === 'home_delivery' && (
                <div>
                  <h4 className="font-semibold">Deliver to:</h4>
                  <p className="text-sm text-muted-foreground">
                    {homeDeliveryAddress.street}, {homeDeliveryAddress.city}, {homeDeliveryAddress.state} - {homeDeliveryAddress.zip}, {homeDeliveryAddress.country}
                  </p>
                </div>
              )}
                {authContext.user ? (
                <Button
                    onClick={proceedToPaymentPage}
                    disabled={isSubmitting || !authContext.user || totalCost <= 0 || isNaN(totalCost)}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-base py-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" /> }
                    {isSubmitting ? 'Redirecting...' : 'Proceed to Secure Payment'}
                </Button>
                ) : (
                 <Button
                    disabled={true}
                    className="w-full text-base py-6 rounded-lg shadow-md"
                    variant="destructive"
                >
                    <UserCheck className="mr-2 h-5 w-5" /> Please Sign In to Place Order
                </Button>
                )}
            </div>
          )}

        </CardContent>
       </Card>

      <div className="flex justify-between mt-6">
        {currentStep !== 'upload_settings' ? (
          <Button variant="outline" onClick={handlePrevStep} disabled={isSubmitting}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
        ) : <div /> }
        {currentStep !== 'summary_payment' && (
          <Button
            onClick={handleNextStep}
            disabled={isSubmitting || (currentStep === 'upload_settings' && (!authContext.user || !validateStep1_UploadSettings())) || (currentStep === 'delivery_details' && (!authContext.user || !validateStep3_DeliveryDetails()))}
            className="ml-auto"
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
