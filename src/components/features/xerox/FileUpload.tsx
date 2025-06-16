
"use client";
import type React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, LogIn, Camera } from "lucide-react"; 
import type { ServiceType } from "./XeroxForm";

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  fileName: string | null;
  isAuthenticated: boolean;
  accept: string; // Added accept prop
  serviceType: ServiceType; // Added serviceType to customize text
}

export function FileUpload({ onFileChange, fileName, isAuthenticated, accept, serviceType }: FileUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      console.warn("FileUpload: Attempted file change while not authenticated.");
      return;
    }
    const file = event.target.files?.[0] || null;
    onFileChange(file);
  };

  const uploadLabel = serviceType === 'document' ? "Click to upload PDF" : "Click to upload Photo";
  const uploadHint = serviceType === 'document' ? "PDF files only (Max 10MB)" : "JPG, PNG files (Max 5MB)";
  const Icon = serviceType === 'document' ? FileText : Camera;


  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-card text-muted-foreground p-4 text-center">
        <LogIn size={32} className="mb-2 text-primary opacity-80" />
        <p className="font-medium">Please Sign In</p>
        <p className="text-sm">You need to be logged in to upload files.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label 
        htmlFor="file-upload" 
        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary transition-colors group"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground group-hover:text-primary" />
          <p className="mb-2 text-sm text-muted-foreground group-hover:text-primary">
            <span className="font-semibold">{uploadLabel}</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">{uploadHint}</p>
        </div>
        <Input
          id="file-upload"
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="sr-only"
          disabled={!isAuthenticated}
        />
      </Label>
      {fileName && (
        <div className="flex items-center p-3 border rounded-md bg-secondary text-sm">
          <Icon size={18} className="mr-2 text-primary shrink-0" />
          <span className="truncate text-secondary-foreground">Selected: {fileName}</span>
        </div>
      )}
    </div>
  );
}
