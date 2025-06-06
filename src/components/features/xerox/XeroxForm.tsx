"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "./FileUpload";
import { PrintSettings } from "./PrintSettings";
import type { Address } from "./DeliveryAddress"; // Import type from sibling
import { DeliveryAddress } from "./DeliveryAddress";
import { OrderSummary } from "./OrderSummary";
import { PaymentSection } from "./PaymentSection";
import { useToast } from "@/hooks/use-toast";

export default function XeroxForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [numPagesStr, setNumPagesStr] = useState<string>("10");
  const [numCopiesStr, setNumCopiesStr] = useState<string>("1");

  const [printColor, setPrintColor] = useState<'color' | 'bw'>('bw');
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'Legal'>('A4');
  const [printSides, setPrintSides] = useState<'single' | 'double'>('single');

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

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : null);
  };
  
  const validateForm = useCallback(() => {
    const numP = parseInt(numPagesStr);
    const numC = parseInt(numCopiesStr);
    const isFileValid = !!file;
    const arePrintSettingsValid = !isNaN(numP) && numP > 0 && !isNaN(numC) && numC > 0;
    const isAddressValid = 
        deliveryAddress.street.trim() !== "" &&
        deliveryAddress.city.trim() !== "" &&
        deliveryAddress.state.trim() !== "" &&
        deliveryAddress.zip.trim() !== "" &&
        deliveryAddress.country.trim() !== "";
    return isFileValid && arePrintSettingsValid && isAddressValid;
  }, [file, numPagesStr, numCopiesStr, deliveryAddress]);

  useEffect(() => {
    setIsOrderDisabled(!validateForm());
  }, [file, numPagesStr, numCopiesStr, deliveryAddress, validateForm]);

  const calculateCost = useCallback(() => {
    const numP = parseInt(numPagesStr);
    const numC = parseInt(numCopiesStr);

    if (isNaN(numP) || numP <= 0 || isNaN(numC) || numC <= 0) {
      setPrintCost(0);
      return;
    }

    let costPerPage = printColor === 'color' ? 0.50 : 0.10;
    
    const paperSizeMultipliers: Record<typeof paperSize, number> = { A4: 1.0, Letter: 1.0, Legal: 1.2 };
    costPerPage *= paperSizeMultipliers[paperSize];

    let currentPrintCost = numP * costPerPage * numC;
    if (printSides === 'double') {
      currentPrintCost *= 0.9; // 10% discount for double-sided
    }
    
    setPrintCost(currentPrintCost);
  }, [numPagesStr, numCopiesStr, printColor, paperSize, printSides]);

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
            description: "Please fill all required fields: upload a PDF, set print options, and provide a delivery address.",
            variant: "destructive",
        });
        return;
    }
    // Placeholder for actual order processing
    console.log("Order placed:", { file: fileName, numPages: numPagesStr, numCopies: numCopiesStr, printColor, paperSize, printSides, deliveryAddress, totalCost });
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
              numCopies={numCopiesStr} setNumCopies={setNumCopiesStr}
              printColor={printColor} setPrintColor={setPrintColor}
              paperSize={paperSize} setPaperSize={setPaperSize}
              printSides={printSides} setPrintSides={setPrintSides}
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline text-2xl text-primary">3. Delivery Address</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <DeliveryAddress address={deliveryAddress} setAddress={setDeliveryAddress} />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6 md:space-y-8 lg:sticky lg:top-8">
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-accent/5">
            <CardTitle className="font-headline text-2xl text-accent">4. Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <OrderSummary printCost={printCost} deliveryFee={deliveryFee} />
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-accent/5">
            <CardTitle className="font-headline text-2xl text-accent">5. Payment</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <PaymentSection onPlaceOrder={handleSubmitOrder} disabled={isOrderDisabled}/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
