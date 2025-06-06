
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

export type PageCountStatus = 'idle' | 'processing' | 'detected' | 'error';

export default function XeroxForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

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

  const handleFileChange = async (selectedFile: File | null) => {
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : null);
  
    if (selectedFile) {
      setPageCountStatus('processing');
      setNumPagesStr(""); 
      toast({
        title: "Processing PDF",
        description: "Attempting to detect page count...",
      });
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pageCount = pdfDoc.getPageCount();
        setNumPagesStr(pageCount.toString());
        setPageCountStatus('detected');
        toast({
          title: "Page Count Detected",
          description: `${pageCount} page(s) found in your PDF.`,
        });
      } catch (error) {
        console.error("Failed to process PDF for page count:", error);
        setNumPagesStr("1"); 
        setPageCountStatus('error');
        toast({
          title: "Detection Failed",
          description: "Could not automatically detect page count. Please enter manually.",
          variant: "destructive",
        });
      }
    } else {
      setNumPagesStr("1"); 
      setPageCountStatus('idle');
    }
  };
  
  const validateForm = useCallback(() => {
    const numP = parseInt(numPagesStr);
    const numC = parseInt(numCopiesStr);
    const isFileValid = !!file;
    const arePrintSettingsValid = !isNaN(numP) && numP > 0 && !isNaN(numC) && numC > 0 && pageCountStatus !== 'processing';
    const isAddressValid = 
        deliveryAddress.street.trim() !== "" &&
        deliveryAddress.city.trim() !== "" &&
        deliveryAddress.state.trim() !== "" &&
        deliveryAddress.zip.trim() !== "" &&
        deliveryAddress.country.trim() !== "";
    return isFileValid && arePrintSettingsValid && isAddressValid;
  }, [file, numPagesStr, numCopiesStr, deliveryAddress, pageCountStatus]);

  useEffect(() => {
    setIsOrderDisabled(!validateForm());
  }, [validateForm]); // Rerun validateForm when its dependencies change

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

  const handleSubmitOrder = () => {
    if (!validateForm()) {
        toast({
            title: "Incomplete Order",
            description: "Please fill all required fields: upload a PDF, set print options (wait for page detection if processing), and provide a delivery address.",
            variant: "destructive",
        });
        return;
    }
    console.log("Order placed:", { file: fileName, numPages: numPagesStr, numCopies: numCopiesStr, printColor, paperSize, printSides, layout, deliveryAddress, totalCost });
    router.push("/order-confirmation");
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
            <CardTitle className="font-headline text-2xl text-accent">Payment</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <PaymentSection onPlaceOrder={handleSubmitOrder} disabled={isOrderDisabled}/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
