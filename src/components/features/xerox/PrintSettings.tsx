
"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Copy, Palette, ScissorsIcon, Newspaper, LayoutGrid } from "lucide-react";

interface PrintSettingsProps {
  numPages: string;
  setNumPages: (value: string) => void;
  numCopies: string;
  setNumCopies: (value: string) => void;
  printColor: 'color' | 'bw';
  setPrintColor: (value: 'color' | 'bw') => void;
  paperSize: 'A4' | 'Letter' | 'Legal';
  setPaperSize: (value: 'A4' | 'Letter' | 'Legal') => void;
  printSides: 'single' | 'double';
  setPrintSides: (value: 'single' | 'double') => void;
  layout: '1up' | '2up';
  setLayout: (value: '1up' | '2up') => void;
}

export function PrintSettings({
  numPages, setNumPages,
  numCopies, setNumCopies,
  printColor, setPrintColor,
  paperSize, setPaperSize,
  printSides, setPrintSides,
  layout, setLayout,
}: PrintSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div>
          <Label htmlFor="num-pages" className="flex items-center space-x-2 mb-1">
            <FileText size={16} className="text-primary"/>
            <span className="font-medium">Number of Pages (in PDF)</span>
          </Label>
          <Input id="num-pages" type="number" min="1" value={numPages} onChange={(e) => setNumPages(e.target.value)} placeholder="e.g., 50" />
        </div>
        <div>
          <Label htmlFor="num-copies" className="flex items-center space-x-2 mb-1">
            <Copy size={16} className="text-primary"/>
            <span className="font-medium">Number of Copies</span>
          </Label>
          <Input id="num-copies" type="number" min="1" value={numCopies} onChange={(e) => setNumCopies(e.target.value)} placeholder="e.g., 1" />
        </div>
      </div>

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
    </div>
  );
}
