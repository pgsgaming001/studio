
"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Copy, Palette, ScissorsIcon, Newspaper, LayoutGrid, Loader2, CheckCircle, AlertCircle, Image as ImageIcon, Award } from "lucide-react";
import type { PageCountStatus, ServiceType, PhotoType } from "./XeroxForm"; 

interface PrintSettingsProps {
  serviceType: ServiceType;
  // Document specific
  numPages: string;
  setNumPages: (value: string) => void;
  pageCountStatus: PageCountStatus;
  paperSize: 'A4' | 'Letter' | 'Legal';
  setPaperSize: (value: 'A4' | 'Letter' | 'Legal') => void;
  printSides: 'single' | 'double';
  setPrintSides: (value: 'single' | 'double') => void;
  layout: '1up' | '2up';
  setLayout: (value: '1up' | '2up') => void;
  // Photo specific
  photoType: PhotoType;
  setPhotoType: (value: PhotoType) => void;
  // Common
  numCopies: string; 
  setNumCopies: (value: string) => void;
  printColor: 'color' | 'bw';
  setPrintColor: (value: 'color' | 'bw') => void;
}

export function PrintSettings({
  serviceType,
  // Document props
  numPages, setNumPages,
  pageCountStatus,
  paperSize, setPaperSize,
  printSides, setPrintSides,
  layout, setLayout,
  // Photo props
  photoType, setPhotoType,
  // Common props
  numCopies, setNumCopies,
  printColor, setPrintColor,
}: PrintSettingsProps) {
  
  const getPageCountPlaceholder = () => {
    if (pageCountStatus === 'processing') return "Detecting...";
    if (pageCountStatus === 'error') return "Enter manually";
    return "e.g., 50";
  };

  const renderPageCountStatusIcon = () => {
    if (pageCountStatus === 'processing') {
      return <Loader2 size={16} className="text-muted-foreground animate-spin ml-2" />;
    }
    if (pageCountStatus === 'detected') {
      return <CheckCircle size={16} className="text-green-500 ml-2" />;
    }
    if (pageCountStatus === 'error') {
      return <AlertCircle size={16} className="text-destructive ml-2" />;
    }
    return null;
  };

  const numCopiesLabel = serviceType === 'document' 
    ? "Number of Copies (of Document Set)" 
    : photoType === 'passport' 
      ? "Number of Passport Photos (e.g., 4, 8, 12)" 
      : "Number of 4x6 Inch Prints";

  return (
    <div className="space-y-6">
      {serviceType === 'document' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="num-pages" className="flex items-center space-x-2 mb-1">
                <FileText size={16} className="text-primary"/>
                <span className="font-medium">Number of Pages (in PDF)</span>
                {renderPageCountStatusIcon()}
              </Label>
              <Input 
                id="num-pages" 
                type="number" 
                min="1" 
                value={numPages} 
                onChange={(e) => setNumPages(e.target.value)} 
                placeholder={getPageCountPlaceholder()}
                readOnly={pageCountStatus === 'detected'}
                disabled={pageCountStatus === 'processing'}
                className={pageCountStatus === 'error' ? 'border-destructive' : ''}
              />
              {pageCountStatus === 'detected' && <p className="text-xs text-muted-foreground mt-1">Page count auto-detected.</p>}
              {pageCountStatus === 'error' && <p className="text-xs text-destructive mt-1">Auto-detection failed. Please enter page count.</p>}
            </div>
            <div>
              <Label htmlFor="num-copies-doc" className="flex items-center space-x-2 mb-1">
                <Copy size={16} className="text-primary"/>
                <span className="font-medium">{numCopiesLabel}</span>
              </Label>
              <Input id="num-copies-doc" type="number" min="1" value={numCopies} onChange={(e) => setNumCopies(e.target.value)} placeholder="e.g., 1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="paper-size" className="flex items-center space-x-2 mb-1">
                <Newspaper size={16} className="text-primary"/>
                <span className="font-medium">Paper Size</span>
              </Label>
              <Select value={paperSize} onValueChange={(value: 'A4' | 'Letter' | 'Legal') => setPaperSize(value)}>
                <SelectTrigger id="paper-size">
                  <SelectValue placeholder="Select paper size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
            <Label className="flex items-center space-x-2 mb-2">
                <ScissorsIcon size={16} className="text-primary"/>
                <span className="font-medium">Sides</span>
              </Label>
              <RadioGroup value={printSides} onValueChange={(value: 'single' | 'double') => setPrintSides(value)} className="flex space-x-4 pt-1">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single-sided" />
                    <Label htmlFor="single-sided" className="font-normal">Single-sided</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="double" id="double-sided" />
                    <Label htmlFor="double-sided" className="font-normal">Double-sided</Label>
                </div>
                </RadioGroup>
            </div>
          </div>
          
          <div>
            <Label htmlFor="layout" className="flex items-center space-x-2 mb-1">
              <LayoutGrid size={16} className="text-primary"/>
              <span className="font-medium">Layout (Pages per Side)</span>
            </Label>
            <Select value={layout} onValueChange={(value: '1up' | '2up') => setLayout(value)}>
              <SelectTrigger id="layout">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1up">1 Page per Side</SelectItem>
                <SelectItem value="2up">2 Pages per Side</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {serviceType === 'photo' && (
        <>
          <div>
            <Label htmlFor="photo-type" className="flex items-center space-x-2 mb-1">
              <ImageIcon size={16} className="text-primary"/>
              <span className="font-medium">Photo Type</span>
            </Label>
            <Select value={photoType} onValueChange={(value: PhotoType) => setPhotoType(value)}>
              <SelectTrigger id="photo-type">
                <SelectValue placeholder="Select photo type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4x6_inch">4x6 Inch Print (Color)</SelectItem>
                <SelectItem value="passport">Passport Photos (8 on a 4x6 sheet, Color)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="num-prints-photo" className="flex items-center space-x-2 mb-1">
              <Award size={16} className="text-primary"/>
              <span className="font-medium">{numCopiesLabel}</span>
            </Label>
            <Input id="num-prints-photo" type="number" min="1" value={numCopies} onChange={(e) => setNumCopies(e.target.value)} placeholder="e.g., 8 for passport, 1 for 4x6" />
          </div>
        </>
      )}

      {/* Common setting for document printing only */}
      {serviceType === 'document' && (
        <div>
            <Label className="flex items-center space-x-2 mb-2">
            <Palette size={16} className="text-primary"/>
            <span className="font-medium">Print Color</span>
            </Label>
            <RadioGroup value={printColor} onValueChange={(value: 'color' | 'bw') => setPrintColor(value)} className="flex space-x-4 pt-1">
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="bw" id="bw" />
                <Label htmlFor="bw" className="font-normal">Black & White</Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="color" id="color" />
                <Label htmlFor="color" className="font-normal">Color</Label>
            </div>
            </RadioGroup>
        </div>
      )}
       {serviceType === 'photo' && (
         <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Palette size={16} className="text-primary"/> All photos are printed in Color.
         </p>
       )}
    </div>
  );
}
