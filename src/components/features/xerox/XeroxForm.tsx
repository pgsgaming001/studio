
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
import { Loader2, CreditCard, ArrowRight, ArrowLeft, UserCheck, FileText, Camera } from "lucide-react";

export type PageCountStatus = 'idle' | 'processing' | 'detected' | 'error';
export type SubmissionStatus = 'idle' | 'preparing' | 'navigating' | 'success' | 'error';
type DeliveryMethod = 'pickup' | 'home_delivery';
export type ServiceType = 'document' | 'photo';
export type PhotoType = 'passport' | '4x6_inch';
type XeroxFormStep = 'service_type' | 'upload_settings' | 'delivery_method' | 'delivery_details' | 'summary_payment';


const PICKUP_CENTERS = ["Tenkasi Main Office", "Madurai Branch", "Chennai Hub"];
const DELIVERY_CHARGE = 40;
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10MB for PDFs
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB for images

// Pricing (Example - adjust as needed)
const DOC_COST_PER_PAGE_BW = 0.10;
const DOC_COST_PER_PAGE_COLOR = 0.50;
const DOC_PAPER_SIZE_MULTIPLIERS = { A4: 1.0, Letter: 1.0, Legal: 1.2 };
const DOC_DOUBLE_SIDED_DISCOUNT = 0.9; // 10% discount

const PHOTO_PASSPORT_SHEET_PRICE_COLOR = 25; // For a sheet of 8 passport photos
const PHOTO_4x6_PRINT_PRICE_COLOR = 12;    // Per 4x6 inch print

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

  const [currentStep, setCurrentStep] = useState<XeroxFormStep>('service_type');
  const [serviceType, setServiceType] = useState<ServiceType>('document');

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null); 

  // Document specific state
  const [numPagesStr, setNumPagesStr] = useState<string>("1");
  const [pageCountStatus, setPageCountStatus] = useState<PageCountStatus>('idle');
  const [layout, setLayout] = useState<'1up' | '2up'>('1up');
  const [printSides, setPrintSides] = useState<'single' | 'double'>('single');
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');

  // Photo specific state
  const [photoType, setPhotoType] = useState<PhotoType>('4x6_inch');

  // Common print settings
  const [numCopiesStr, setNumCopiesStr] = useState<string>("1"); 
  const [printColor, setPrintColor] = useState<'color' | 'bw'>('bw');

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

  // Effect to handle default printColor for photos
  useEffect(() => {
    if (serviceType === 'photo') {
      setPrintColor('color'); // Photos are always color
      // Reset document-specific settings if switching to photo
      setNumPagesStr("1");
      setPageCountStatus('idle');
    } else {
      // Optionally reset photo-specific settings if switching to document
      // setPrintColor('bw'); // Default back to BW for documents or keep user's last doc choice
    }
  }, [serviceType]);


  const handleFileChange = async (selectedFile: File | null) => {
    if (!authContext.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in with Google to upload.",
        variant: "destructive",
      });
      setFile(null); setFileName(null); setFileDataUri(null); setPageCountStatus('idle');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : null);
    setFileDataUri(null); 

    if (selectedFile) {
      const maxSizeBytes = serviceType === 'document' ? MAX_PDF_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
      const serviceNameForToast = serviceType === 'document' ? 'PDF' : 'Image';
      if (selectedFile.size > maxSizeBytes) {
        toast({
          title: "File Too Large",
          description: `${serviceNameForToast} exceeds max size. Max: ${(maxSizeBytes / (1024*1024)).toFixed(0)}MB. Yours: ${(selectedFile.size / (1024*1024)).toFixed(2)} MB.`,
          variant: "destructive",
        });
        setFile(null); setFileName(null); setPageCountStatus('idle'); 
        if (serviceType === 'document') setNumPagesStr("1");
        return;
      }

      if (serviceType === 'document') {
        setPageCountStatus('processing'); setNumPagesStr("");
        toast({ title: "Processing PDF...", description: "Detecting page count..." });
        try {
          const arrayBuffer = await selectedFile.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const pageCount = pdfDoc.getPageCount();
          setNumPagesStr(pageCount.toString());
          setPageCountStatus('detected');
          toast({ title: "PDF Processed", description: `${pageCount} page(s) found. File ready.` });
        } catch (error) {
          console.error("Failed to process PDF:", error);
          setNumPagesStr("1"); setPageCountStatus('error');
          toast({ title: "PDF Error", description: "Could not read PDF. Try another or enter page count manually.", variant: "destructive" });
        }
      } else { 
        setPageCountStatus('idle'); 
        setNumPagesStr("1"); 
        const arrayBuffer = await selectedFile.arrayBuffer();
        setFileDataUri(arrayBufferToDataUri(arrayBuffer, selectedFile.type));
        toast({ title: "Image Selected", description: "Image ready for preview and settings." });
      }
    } else { 
      if (serviceType === 'document') setNumPagesStr("1");
      setPageCountStatus('idle'); setFileDataUri(null);
    }
  };

  const calculateCost = useCallback(() => {
    let currentPrintCost = 0;

    if (serviceType === 'document') {
      const numP = parseInt(numPagesStr);
      const numC = parseInt(numCopiesStr);
      if (isNaN(numP) || numP <= 0 || isNaN(numC) || numC <= 0 || pageCountStatus === 'processing') {
        setPrintCost(0); return;
      }
      let costPerPage = printColor === 'color' ? DOC_COST_PER_PAGE_COLOR : DOC_COST_PER_PAGE_BW;
      costPerPage *= DOC_PAPER_SIZE_MULTIPLIERS[paperSize];
      currentPrintCost = numP * costPerPage * numC;
      if (printSides === 'double') currentPrintCost *= DOC_DOUBLE_SIDED_DISCOUNT;
    } else { // Photo service - always color
      const numPhotosOrSheets = parseInt(numCopiesStr); // This is individual photos for passport, or 4x6 prints
      if (isNaN(numPhotosOrSheets) || numPhotosOrSheets <= 0) {
        setPrintCost(0); return;
      }
      if (photoType === 'passport') {
        const numSheets = Math.ceil(numPhotosOrSheets / 8); // 8 passport photos per sheet
        currentPrintCost = numSheets * PHOTO_PASSPORT_SHEET_PRICE_COLOR;
      } else if (photoType === '4x6_inch') {
        currentPrintCost = numPhotosOrSheets * PHOTO_4x6_PRINT_PRICE_COLOR;
      }
    }
    setPrintCost(currentPrintCost);
  }, [numPagesStr, numCopiesStr, printColor, paperSize, printSides, pageCountStatus, serviceType, photoType]);

  useEffect(() => {
    calculateCost();
  }, [calculateCost]);

  useEffect(() => {
    const currentDeliveryFee = deliveryMethod === 'home_delivery' ? DELIVERY_CHARGE : 0;
    setActualDeliveryFee(currentDeliveryFee);
    setTotalCost(printCost + currentDeliveryFee);
  }, [printCost, deliveryMethod]);

  const validateStep_ServiceType = () => {
    return !!serviceType;
  }

  const validateStep_UploadSettings = () => {
    if (!authContext.user) return false;
    const isFileValid = !!file; 

    if (serviceType === 'document') {
      const numP = parseInt(numPagesStr);
      const numC = parseInt(numCopiesStr);
      return isFileValid && !isNaN(numP) && numP > 0 && !isNaN(numC) && numC > 0 && pageCountStatus !== 'processing' && pageCountStatus !== 'error';
    } else { 
      const numPhotosOrSheets = parseInt(numCopiesStr);
      return isFileValid && !isNaN(numPhotosOrSheets) && numPhotosOrSheets > 0;
    }
  };

  const validateStep_DeliveryDetails = () => {
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
    if (!authContext.user && currentStep !== 'service_type') { 
      toast({ title: "Authentication Required", description: "Please sign in to proceed.", variant: "destructive" });
      return;
    }

    if (currentStep === 'service_type' && validateStep_ServiceType()) setCurrentStep('upload_settings');
    else if (currentStep === 'upload_settings' && validateStep_UploadSettings()) setCurrentStep('delivery_method');
    else if (currentStep === 'delivery_method') setCurrentStep('delivery_details');
    else if (currentStep === 'delivery_details' && validateStep_DeliveryDetails()) setCurrentStep('summary_payment');
    else {
       let errorTitle = "Incomplete Information";
       let errorDesc = "Please complete the current step.";
       if (currentStep === 'upload_settings' && !validateStep_UploadSettings()) {
          errorDesc = serviceType === 'document' ? "Please upload a valid PDF, ensure page count and copies are set." : "Please upload an image and set number of photos/prints.";
       } else if (currentStep === 'delivery_details' && !validateStep_DeliveryDetails()){
          errorDesc = "Please complete the delivery or pickup details.";
       }
       toast({ title: errorTitle, description: errorDesc, variant: "destructive" });
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'summary_payment') setCurrentStep('delivery_details');
    else if (currentStep === 'delivery_details') setCurrentStep('delivery_method');
    else if (currentStep === 'delivery_method') setCurrentStep('upload_settings');
    else if (currentStep === 'upload_settings') setCurrentStep('service_type');
  };

  const proceedToPaymentPage = async () => {
    if (!authContext.user) {
        toast({ title: "Authentication Required", description: "Please sign in to proceed.", variant: "destructive" });
        return;
    }
    if (!validateStep_UploadSettings() || !validateStep_DeliveryDetails()) {
        toast({ title: "Incomplete Information", description: "Please ensure all previous steps are complete.", variant: "destructive" });
        return;
    }
    if (!file) { 
        toast({ title: "File Error", description: "File data is missing. Please re-upload.", variant: "destructive" });
        return;
    }
    if (isNaN(totalCost) || totalCost <= 0) {
        toast({ title: "Invalid Order Total", description: "Cannot proceed with zero or invalid cost. Please review settings.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    setFormSubmissionStatus('navigating');
    toast({ title: "Proceeding to Secure Payment", description: "All print orders require online payment. Redirecting..." });

    let currentFileDataUri = fileDataUri; 
    if (serviceType === 'document' && file && !fileDataUri) { 
        try {
            const arrayBuffer = await file.arrayBuffer();
            currentFileDataUri = arrayBufferToDataUri(arrayBuffer, file.type);
        } catch (error) {
            console.error("Error generating Data URI for PDF:", error);
            toast({ title: "File Processing Error", description: "Could not prepare PDF for payment. Please try again.", variant: "destructive"});
            setIsSubmitting(false);
            setFormSubmissionStatus('error');
            return;
        }
    }
    
    if (!currentFileDataUri) {
        toast({ title: "File Error", description: "File data could not be prepared. Please re-upload.", variant: "destructive" });
        setIsSubmitting(false);
        setFormSubmissionStatus('error');
        return;
    }


    const queryParams = new URLSearchParams({
        serviceType,
        fileName: fileName || "Untitled",
        numCopies: numCopiesStr, // This is individual passport photos, or 4x6 prints, or doc sets
        printColor: serviceType === 'photo' ? 'color' : printColor, // Photos always color
        totalCost: totalCost.toString(),
        deliveryMethod,
        userId: authContext.user.uid,
        userEmail: authContext.user.email || '',
        userName: authContext.user.displayName || '',
    });

    if (serviceType === 'document') {
        queryParams.set('numPages', numPagesStr);
        queryParams.set('paperSize', paperSize);
        queryParams.set('printSides', printSides);
        queryParams.set('layout', layout);
    } else { 
        queryParams.set('photoType', photoType);
    }

    if (deliveryMethod === 'home_delivery') {
        queryParams.set('street', homeDeliveryAddress.street);
        queryParams.set('city', homeDeliveryAddress.city);
        queryParams.set('state', homeDeliveryAddress.state);
        queryParams.set('zip', homeDeliveryAddress.zip);
        queryParams.set('country', homeDeliveryAddress.country);
    } else if (deliveryMethod === 'pickup') {
        queryParams.set('pickupCenter', selectedPickupCenter);
    }

    sessionStorage.setItem('pendingOrderFileDataUri', currentFileDataUri);
    router.push(`/payment?${queryParams.toString()}`);
  };


  const getStepTitle = () => {
    switch(currentStep) {
      case 'service_type': return "1. Select Service Type";
      case 'upload_settings': return `2. Upload & Settings for ${serviceType === 'document' ? 'Document' : 'Photo'}`;
      case 'delivery_method': return "3. Delivery Method";
      case 'delivery_details': return `4. ${deliveryMethod === 'pickup' ? 'Pickup Details' : 'Delivery Address'}`;
      case 'summary_payment': return "5. Summary & Proceed to Payment";
      default: return "Print Service";
    }
  };
  
  const fileInputAccept = serviceType === 'document' ? '.pdf' : 'image/jpeg, image/png, image/jpg';


  return (
    <div className="space-y-6 md:space-y-8">
       <Card className="shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-primary/5">
          <CardTitle className="font-headline text-2xl text-primary">{getStepTitle()}</CardTitle>
           {!authContext.user && currentStep !== 'service_type' && (
            <CardDescription className="text-destructive font-medium">
                Please sign in with Google to configure your order.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {currentStep === 'service_type' && (
            <div className="space-y-4">
              <Label className="text-lg font-medium">What would you like to print?</Label>
              <RadioGroup value={serviceType} onValueChange={(val) => setServiceType(val as ServiceType)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Label htmlFor="document_service" className="flex flex-col items-center justify-center text-center p-6 border rounded-lg hover:bg-secondary/50 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary">
                  <RadioGroupItem value="document" id="document_service" className="sr-only" />
                  <FileText size={48} className="mb-3 text-primary" />
                  <span className="text-xl font-semibold">Documents</span>
                  <span className="text-sm text-muted-foreground">PDFs, Reports, Assignments</span>
                </Label>
                <Label htmlFor="photo_service" className="flex flex-col items-center justify-center text-center p-6 border rounded-lg hover:bg-secondary/50 cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary">
                  <RadioGroupItem value="photo" id="photo_service" className="sr-only" />
                  <Camera size={48} className="mb-3 text-primary" />
                  <span className="text-xl font-semibold">Photos</span>
                  <span className="text-sm text-muted-foreground">Passport, 4x6 Inch Prints</span>
                </Label>
              </RadioGroup>
            </div>
          )}

          {currentStep === 'upload_settings' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <FileUpload
                    onFileChange={handleFileChange}
                    fileName={fileName}
                    isAuthenticated={!!authContext.user}
                    accept={fileInputAccept}
                    serviceType={serviceType}
                />
                {file && authContext.user && (
                  <PrintSettings
                    serviceType={serviceType}
                    // Document settings
                    numPages={numPagesStr} setNumPages={setNumPagesStr}
                    pageCountStatus={pageCountStatus}
                    paperSize={paperSize} setPaperSize={setPaperSize}
                    printSides={printSides} setPrintSides={setPrintSides}
                    layout={layout} setLayout={setLayout}
                    // Photo settings
                    photoType={photoType} setPhotoType={setPhotoType}
                    // Common settings
                    numCopies={numCopiesStr} setNumCopies={setNumCopiesStr}
                    printColor={printColor} setPrintColor={setPrintColor}
                  />
                )}
              </div>
              <div>
                {file && authContext.user && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-accent">
                        {serviceType === 'document' ? 'Schematic Preview' : 'Image Preview'}
                      </CardTitle>
                      <CardDescription>
                        {serviceType === 'document' ? 'First physical sheet layout.' : 'Your selected image.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PrintPreview
                        serviceType={serviceType}
                        fileName={fileName}
                        fileDataUri={fileDataUri} 
                        // Document specific
                        numPages={numPagesStr}
                        printSides={printSides}
                        layout={layout}
                        // Photo specific
                        photoType={photoType}
                        numCopies={numCopiesStr}
                      />
                    </CardContent>
                  </Card>
                )}
                 {!authContext.user && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-center">
                        <UserCheck className="mx-auto h-10 w-10 text-yellow-500 mb-2" />
                        <p className="font-semibold text-yellow-700">Please Sign In</p>
                        <p className="text-sm text-yellow-600">You need to be logged in to upload files and configure print settings.</p>
                        <Button onClick={authContext.signInWithGoogle} className="mt-3" variant="outline" size="sm">Sign In with Google</Button>
                    </div>
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

              <p className="text-sm">Service Type: <span className="font-medium capitalize">{serviceType}</span></p>
              
              {serviceType === 'document' && (
                <>
                  <p className="text-sm">Pages in PDF: <span className="font-medium">{numPagesStr}</span></p>
                  <p className="text-sm">Number of Document Sets: <span className="font-medium">{numCopiesStr}</span></p>
                  <p className="text-sm">Color: <span className="font-medium capitalize">{printColor}</span></p>
                </>
              )}
              {serviceType === 'photo' && (
                <>
                    <p className="text-sm">Photo Type: <span className="font-medium">{photoType === '4x6_inch' ? '4x6 Inch (Color)' : 'Passport Photos (Color)'}</span></p>
                    <p className="text-sm">Number of {photoType === 'passport' ? 'Individual Passport Photos' : '4x6 Inch Prints'}: <span className="font-medium">{numCopiesStr}</span></p>
                </>
              )}
              <p className="text-sm">File: <span className="font-medium">{fileName || "N/A"}</span></p>


              {deliveryMethod === 'pickup' && selectedPickupCenter && (
                <p className="text-sm">Pickup from: <span className="font-medium">{selectedPickupCenter}</span>.</p>
              )}
               {deliveryMethod === 'home_delivery' && (
                <div>
                  <h4 className="font-semibold text-sm">Deliver to:</h4>
                  <p className="text-xs text-muted-foreground">
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
        {currentStep !== 'service_type' ? (
          <Button variant="outline" onClick={handlePrevStep} disabled={isSubmitting}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
        ) : <div /> }
        {currentStep !== 'summary_payment' && (
          <Button
            onClick={handleNextStep}
            disabled={isSubmitting || 
              (currentStep === 'upload_settings' && (!authContext.user || !validateStep_UploadSettings())) || 
              (currentStep === 'delivery_details' && (!authContext.user || !validateStep_DeliveryDetails())) ||
              (currentStep === 'service_type' && !validateStep_ServiceType())
            }
            className="ml-auto"
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
