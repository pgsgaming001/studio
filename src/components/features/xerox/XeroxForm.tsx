
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "./FileUpload";
import { PrintSettings } from "./PrintSettings";
import type { Address } from "./DeliveryAddress";
import { DeliveryAddress } from "./DeliveryAddress";
import { OrderSummary } from "./OrderSummary";
import { PaymentSection } from "./PaymentSection";
import { PrintPreview } from "./PrintPreview";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument } from 'pdf-lib';
// Changed the import to use the new MongoDB action
import { submitOrderToMongoDB, type OrderFormPayload } from '@/app/actions/submitOrder'; 

export type PageCountStatus = 'idle' | 'processing' | 'detected' | 'error';

// Helper function to convert ArrayBuffer to Base64 Data URI
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

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function XeroxForm() {
  const router = useRouter();
  const { toast } = useToast();

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

  const [deliveryAddress, setDeliveryAddress] = useState<Address>({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  const [printCost, setPrintCost] = useState<number>(0);
  const deliveryFee = 5.00; 
  const [totalCost, setTotalCost] = useState<number>(deliveryFee);
  const [isOrderDisabled, setIsOrderDisabled] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);


  const handleFileChange = async (selectedFile: File | null) => {
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : null);
    setFileDataUri(null); 
  
    if (selectedFile) {
      if (selectedFile.size > MAX_PDF_SIZE_BYTES) {
        toast({
          title: "File Too Large",
          description: `The selected PDF exceeds the 10MB size limit. Please choose a smaller file. Your file is ${(selectedFile.size / (1024*1024)).toFixed(2)} MB.`,
          variant: "destructive",
        });
        setFile(null);
        setFileName(null);
        setPageCountStatus('idle');
        setNumPagesStr("1");
        return;
      }

      setPageCountStatus('processing');
      setNumPagesStr(""); 
      toast({
        title: "Processing PDF",
        description: "Attempting to detect page count and prepare file...",
      });
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pageCount = pdfDoc.getPageCount();
        setNumPagesStr(pageCount.toString());
        setPageCountStatus('detected');
        
        const dataUri = arrayBufferToDataUri(arrayBuffer, selectedFile.type);
        setFileDataUri(dataUri);

        toast({
          title: "PDF Processed",
          description: `${pageCount} page(s) found. File ready for submission.`,
        });
      } catch (error) {
        console.error("Failed to process PDF:", error);
        setNumPagesStr("1"); 
        setPageCountStatus('error');
        setFileDataUri(null);
        toast({
          title: "PDF Processing Failed",
          description: "Could not read PDF for page count or prepare for upload. Please try another file or enter page count manually.",
          variant: "destructive",
        });
      }
    } else {
      setNumPagesStr("1"); 
      setPageCountStatus('idle');
      setFileDataUri(null);
    }
  };
  
  const validateForm = useCallback(() => {
    const numP = parseInt(numPagesStr);
    const numC = parseInt(numCopiesStr);
    const isFileValid = !!file && !!fileDataUri; 
    const arePrintSettingsValid = !isNaN(numP) && numP > 0 && !isNaN(numC) && numC > 0 && pageCountStatus !== 'processing';
    const isAddressValid = 
        deliveryAddress.street.trim() !== "" &&
        deliveryAddress.city.trim() !== "" &&
        deliveryAddress.state.trim() !== "" &&
        deliveryAddress.zip.trim() !== "" &&
        deliveryAddress.country.trim() !== "";
    return isFileValid && arePrintSettingsValid && isAddressValid;
  }, [file, fileDataUri, numPagesStr, numCopiesStr, deliveryAddress, pageCountStatus]);

  useEffect(() => {
    setIsOrderDisabled(!validateForm() || isSubmitting);
  }, [validateForm, isSubmitting]); 

  const calculateCost = useCallback(() => {
    const numP = parseInt(numPagesStr);
    const numC = parseInt(numCopiesStr);

    if (isNaN(numP) || numP <= 0 || isNaN(numC) || numC <= 0 || pageCountStatus === 'processing') {
      setPrintCost(0);
      return;
    }

    let costPerPage = printColor === 'color' ? 0.50 : 0.10;
    
    const paperSizeMultipliers: Record<typeof paperSize, number> = { A4: 1.0, Letter: 1.0, Legal: 1.2 };
    costPerPage *= paperSizeMultipliers[paperSize];

    let currentPrintCost = numP * costPerPage * numC;
    if (printSides === 'double') {
      currentPrintCost *= 0.9; 
    }
    
    setPrintCost(currentPrintCost);
  }, [numPagesStr, numCopiesStr, printColor, paperSize, printSides, pageCountStatus]);

  useEffect(() => {
    calculateCost();
  }, [calculateCost]);

  useEffect(() => {
    setTotalCost(printCost + deliveryFee);
  }, [printCost, deliveryFee]);

  const handleSubmitOrder = async () => {
    if (!validateForm() || !fileDataUri) { 
        toast({
            title: "Incomplete Order",
            description: "Please upload a PDF, ensure it's processed, set print options, and provide a delivery address.",
            variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);
    toast({
      title: "Placing Order...",
      description: "Submitting your order details and uploading file. Please wait.",
    });

    const orderPayload: OrderFormPayload = {
      fileName,
      fileDataUri, 
      numPages: numPagesStr,
      numCopies: numCopiesStr,
      printColor,
      paperSize,
      printSides,
      layout,
      deliveryAddress,
      totalCost,
    };

    try {
      // Changed to use the MongoDB submission action
      const result = await submitOrderToMongoDB(orderPayload); 
      if (result.success) {
        toast({
          title: "Order Submitted!",
          description: `Your order (ID: ${result.orderId}) has been successfully submitted.`,
        });
        router.push("/order-confirmation");
      } else {
        toast({
          title: "Order Submission Failed",
          description: result.error || "An unknown error occurred while submitting to the database.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in handleSubmitOrder calling Server Action:", error);
      let message = "An unexpected error occurred while submitting your order.";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        title: "Order Submission Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
      <div className="lg:col-span-2 space-y-6 md:space-y-8">
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline text-2xl text-primary">1. Upload Your PDF</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <FileUpload onFileChange={handleFileChange} fileName={fileName} />
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline text-2xl text-primary">2. Print Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <PrintSettings
              numPages={numPagesStr} setNumPages={setNumPagesStr}
              pageCountStatus={pageCountStatus}
              numCopies={numCopiesStr} setNumCopies={setNumCopiesStr}
              printColor={printColor} setPrintColor={setPrintColor}
              paperSize={paperSize} setPaperSize={setPaperSize}
              printSides={printSides} setPrintSides={setPrintSides}
              layout={layout} setLayout={setLayout}
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline text-2xl text-primary">3. Print Preview (Schematic)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <PrintPreview
              fileName={fileName}
              numPages={numPagesStr}
              printSides={printSides}
              layout={layout}
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline text-2xl text-primary">4. Delivery Address</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <DeliveryAddress address={deliveryAddress} setAddress={setDeliveryAddress} />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6 md:space-y-8 lg:sticky lg:top-8">
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-accent/5">
            <CardTitle className="font-headline text-2xl text-accent">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <OrderSummary printCost={printCost} deliveryFee={deliveryFee} />
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-accent/5">
            <CardTitle className="font-headline text-2xl text-accent">Place Order</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <PaymentSection onPlaceOrder={handleSubmitOrder} disabled={isOrderDisabled || isSubmitting}/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
