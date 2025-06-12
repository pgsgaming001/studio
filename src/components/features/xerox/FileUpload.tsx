
"use client";
import type React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, LogIn } from "lucide-react"; // Added LogIn

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  fileName: string | null;
  isAuthenticated: boolean; // Added isAuthenticated prop
}

export function FileUpload({ onFileChange, fileName, isAuthenticated }: FileUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      // This case should ideally be prevented by disabling the input or the parent action
      console.warn("FileUpload: Attempted file change while not authenticated.");
      return;
    }
    const file = event.target.files?.[0] || null;
    onFileChange(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-card text-muted-foreground p-4 text-center">
        <LogIn size={32} className="mb-2 text-primary opacity-80" />
        <p className="font-medium">Please Sign In</p>
        <p className="text-sm">You need to be logged in to upload documents.</p>
      </div>
    );
  }

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
          <p className="text-xs text-muted-foreground">PDF files only (Max 10MB)</p>
        </div>
        <Input
          id="pdf-upload"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="sr-only"
          disabled={!isAuthenticated} // Explicitly disable if not authenticated
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
