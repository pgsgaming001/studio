
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileWarning, Printer } from "lucide-react";

interface PrintPreviewProps {
  fileName: string | null;
  numPages: string;
  printSides: 'single' | 'double';
  layout: '1up' | '2up';
}

export function PrintPreview({ fileName, numPages, printSides, layout }: PrintPreviewProps) {
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

  // Only show the first physical sheet (i = 0)
  if (numPhysicalSheets > 0) {
    const sheetNumber = 1; // Always sheet 1
    const sheetElements = [];

    // Front Side
    const frontLayoutSideIndex = 0 * (isDoubleSided ? 2 : 1); // i is always 0
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

    // Back Side
    if (isDoubleSided) {
      const backLayoutSideIndex = 0 * 2 + 1; // i is always 0
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
}

