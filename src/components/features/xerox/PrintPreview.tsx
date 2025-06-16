
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileWarning, Printer, Image as ImageIcon, Maximize } from "lucide-react";
import Image from "next/image"; // For displaying uploaded image
import type { ServiceType, PhotoType } from "./XeroxForm";

interface PrintPreviewProps {
  serviceType: ServiceType;
  fileName: string | null;
  fileDataUri?: string | null; // For photo preview
  // Document specific
  numPages: string;
  printSides: 'single' | 'double';
  layout: '1up' | '2up';
  // Photo specific
  photoType: PhotoType;
  numCopies: string; // Number of prints/sheets
}

export function PrintPreview({ 
  serviceType, 
  fileName, 
  fileDataUri,
  numPages, 
  printSides, 
  layout,
  photoType,
  numCopies
}: PrintPreviewProps) {

  if (serviceType === 'document') {
    const logicalPagesCount = parseInt(numPages) || 0;
    if (!fileName || logicalPagesCount <= 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-card text-muted-foreground min-h-[200px]">
          <FileWarning size={48} className="mb-4 opacity-50" />
          <p className="font-medium">Upload a PDF and set the number of pages</p>
          <p className="text-sm">to see a schematic print preview here.</p>
        </div>
      );
    }

    const pagesPerLayoutSide = layout === '2up' ? 2 : 1;
    const isDoubleSided = printSides === 'double';
    const numLayoutSidesNeeded = Math.ceil(logicalPagesCount / pagesPerLayoutSide);
    const numPhysicalSheets = isDoubleSided ? Math.ceil(numLayoutSidesNeeded / 2) : numLayoutSidesNeeded;
    const sheetPreviews = [];

    if (numPhysicalSheets > 0) {
      const sheetNumber = 1; 
      const sheetElements = [];
      const frontLayoutSideIndex = 0;
      if (frontLayoutSideIndex < numLayoutSidesNeeded) {
        const frontPages = [];
        const frontLogicalPageIndexStart = frontLayoutSideIndex * pagesPerLayoutSide;
        for (let j = 0; j < pagesPerLayoutSide; j++) {
          const currentLogicalPage = frontLogicalPageIndexStart + j + 1;
          frontPages.push(
            <div key={`sheet-${sheetNumber}-front-page-${j}`} className="flex-1 border border-muted-foreground/30 bg-background p-2 m-1 rounded text-xs text-center min-h-[60px] flex items-center justify-center">
              {currentLogicalPage <= logicalPagesCount ? `Page ${currentLogicalPage}` : <span className="opacity-50">(Empty)</span>}
            </div>
          );
        }
        sheetElements.push(
          <div key={`sheet-${sheetNumber}-front`} className="mb-2">
            <p className="text-xs font-semibold mb-1 text-center text-foreground">Sheet {sheetNumber} - Front</p>
            <div className="flex p-2 border border-muted-foreground/50 rounded-md bg-card shadow-sm min-h-[80px]">
              {frontPages}
            </div>
          </div>
        );
      }

      if (isDoubleSided) {
        const backLayoutSideIndex = 1;
        if (backLayoutSideIndex < numLayoutSidesNeeded) {
          const backPages = [];
          const backLogicalPageIndexStart = backLayoutSideIndex * pagesPerLayoutSide;
          for (let j = 0; j < pagesPerLayoutSide; j++) {
            const currentLogicalPage = backLogicalPageIndexStart + j + 1;
            backPages.push(
              <div key={`sheet-${sheetNumber}-back-page-${j}`} className="flex-1 border border-muted-foreground/30 bg-background p-2 m-1 rounded text-xs text-center min-h-[60px] flex items-center justify-center">
                {currentLogicalPage <= logicalPagesCount ? `Page ${currentLogicalPage}` : <span className="opacity-50">(Empty)</span>}
              </div>
            );
          }
          sheetElements.push(
            <div key={`sheet-${sheetNumber}-back`}>
              <p className="text-xs font-semibold mb-1 text-center text-foreground">Sheet {sheetNumber} - Back</p>
              <div className="flex p-2 border border-muted-foreground/50 rounded-md bg-card shadow-sm min-h-[80px]">
                {backPages}
              </div>
            </div>
          );
        } else if (frontLayoutSideIndex < numLayoutSidesNeeded) { 
           sheetElements.push(
            <div key={`sheet-${sheetNumber}-back-empty`} className="opacity-60">
              <p className="text-xs font-semibold mb-1 text-center">Sheet {sheetNumber} - Back</p>
              <div className="flex p-2 border border-muted-foreground/50 rounded-md bg-card shadow-sm min-h-[80px] items-center justify-center">
                 <span className="text-xs">(Blank)</span>
              </div>
            </div>
          );
        }
      }
      if (sheetElements.length > 0) {
          sheetPreviews.push(
              <div key={`physical-sheet-${sheetNumber}`} className="mb-4 p-3 border border-primary/20 rounded-lg bg-secondary/30">
              {sheetElements}
              </div>
          );
      }
    }
    return (
      <div className="space-y-4">
        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
          {sheetPreviews.length > 0 ? sheetPreviews : (
            <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-card text-muted-foreground min-h-[200px]">
               <Printer size={48} className="mb-4 opacity-50" />
               <p className="font-medium">Preview for the first sheet will appear here.</p>
            </div>
          )}
        </div>
        {numPhysicalSheets > 1 && (
          <p className="text-xs text-muted-foreground text-center">
            Showing preview for the first physical sheet. Total physical sheets: {numPhysicalSheets}.
          </p>
        )}
         <p className="text-xs text-muted-foreground text-center mt-2">
            Total logical pages in PDF: {logicalPagesCount}.
        </p>
      </div>
    );

  } else { // Photo Service
    if (!fileName || !fileDataUri) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg bg-card text-muted-foreground min-h-[200px]">
          <ImageIcon size={48} className="mb-4 opacity-50" />
          <p className="font-medium">Upload an image</p>
          <p className="text-sm">to see a preview here.</p>
        </div>
      );
    }

    const numSheets = parseInt(numCopies) || 1;

    if (photoType === 'passport') {
      const photosPerSheet = 8; // 2 columns x 4 rows
      return (
        <div className="space-y-3">
          <div 
            className="mx-auto w-full max-w-[240px] aspect-[4/6] p-1 border bg-muted rounded-md shadow-sm grid grid-cols-2 gap-1"
            aria-label="Passport photo sheet preview"
            title="Preview of 8 passport photos on a 4x6 sheet"
          >
            {Array.from({ length: photosPerSheet }).map((_, index) => (
              <div key={`passport-preview-${index}`} className="relative aspect-[3/4] bg-background overflow-hidden border border-muted-foreground/20">
                <Image 
                  src={fileDataUri} 
                  alt={`Passport photo ${index + 1}`} 
                  layout="fill" 
                  objectFit="cover"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {numSheets} sheet(s), {photosPerSheet} photos per sheet.
          </p>
          <p className="text-xs text-center text-muted-foreground">
            <Maximize size={12} className="inline mr-1"/>Ensure uploaded image is suitable for passport photos.
          </p>
        </div>
      );
    } else { // 4x6_inch
      return (
        <div className="space-y-3">
          <div className="relative aspect-[6/4] w-full rounded-md border bg-muted overflow-hidden shadow-sm">
            <Image src={fileDataUri} alt={fileName || "4x6 photo preview"} layout="fill" objectFit="contain" />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {numSheets} print(s) of your 4x6 inch photo.
          </p>
        </div>
      );
    }
  }
}
