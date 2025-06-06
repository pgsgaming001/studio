"use client";
import type React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText } from "lucide-react";

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  fileName: string | null;
}

export function FileUpload({ onFileChange, fileName }: FileUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileChange(file);
  };

  return (
    <div className="space-y-3">
      <Label 
        htmlFor="pdf-upload" 
        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary transition-colors group"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground group-hover:text-primary" />
          <p className="mb-2 text-sm text-muted-foreground group-hover:text-primary">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">PDF files only</p>
        </div>
        <Input
          id="pdf-upload"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="sr-only"
        />
      </Label>
      {fileName && (
        <div className="flex items-center p-3 border rounded-md bg-secondary text-sm">
          <FileText size={18} className="mr-2 text-primary shrink-0" />
          <span className="truncate text-secondary-foreground">Selected: {fileName}</span>
        </div>
      )}
    </div>
  );
}
