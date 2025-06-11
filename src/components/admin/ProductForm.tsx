
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, UploadCloud, ImagePlus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";
import type { ProductFormPayload } from "@/app/actions/addProduct"; 
import { addProduct } from "@/app/actions/addProduct"; 
import imageCompression from 'browser-image-compression';

const CATEGORY_OPTIONS = ["Electronics", "Home Goods", "Fashion", "Office"];

const clientProductFormSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  category: z.string().min(2, "Category is required.").refine(
    (val) => CATEGORY_OPTIONS.includes(val),
    { message: "Please select a valid category." }
  ),
  price: z.coerce.number({ invalid_type_error: "Price must be a number." }).positive("Price must be positive."),
  originalPrice: z.coerce.number({ invalid_type_error: "Original price must be a number." }).optional(),
  stock: z.coerce.number({ invalid_type_error: "Stock must be a number." }).int().min(0, "Stock cannot be negative."),
  imageFiles: z.custom<FileList | null>((val) => val === null || val instanceof FileList, "Please upload valid image files.")
                 .refine(files => files === null || files.length === 0 || Array.from(files).every(file => file.type.startsWith("image/")), {
                    message: "Only image files are allowed.",
                  })
                 .refine(files => files === null || files.length <= 5, "Maximum 5 images allowed.")
                 .optional(),
  tags: z.string().optional(),
  status: z.enum(['active', 'draft', 'inactive']).default('draft'),
  isFeatured: z.boolean().default(false),
});

type ClientProductFormData = z.infer<typeof clientProductFormSchema>;

interface ProductFormProps {
  mode?: 'add' | 'edit';
}

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


export function ProductForm({ mode = 'add' }: ProductFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);


  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ClientProductFormData>({
    resolver: zodResolver(clientProductFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "", // Default to empty, user must select
      price: 0,
      originalPrice: undefined,
      stock: 0,
      imageFiles: null,
      tags: "",
      status: 'draft',
      isFeatured: false,
    },
  });
  
  const imageFiles = watch("imageFiles");

  useEffect(() => {
    if (imageFiles && imageFiles.length > 0) {
      const newPreviews: string[] = [];
      Array.from(imageFiles).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === imageFiles.length) {
            setImagePreviews(newPreviews);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      setImagePreviews([]);
    }
  }, [imageFiles]);


  const onSubmit = async (data: ClientProductFormData) => {
    setIsSubmitting(true);
    toast({ title: "Processing...", description: `${mode === 'add' ? 'Compressing images and adding' : 'Compressing images and updating'} product. Please wait.` });

    let imageDataUris: string[] = [];
    if (data.imageFiles && data.imageFiles.length > 0) {
        const compressionOptions = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
        };
        toast({ title: "Compressing Images...", description: `Starting image compression for ${data.imageFiles.length} file(s). This may take a moment.` });
        for (const file of Array.from(data.imageFiles)) {
            try {
                console.log(`Original file: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)} MB, type: ${file.type}`);
                
                const compressedFile = await imageCompression(file, compressionOptions);
                console.log(`Compressed file: ${compressedFile.name}, size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB, type: ${compressedFile.type}`);
                
                const dataUri = await fileToDataUri(compressedFile);
                imageDataUris.push(dataUri);
                toast({ title: "Image Compressed", description: `${file.name} compressed successfully. New size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB` });

            } catch (error) {
                console.error("Error compressing or converting file to data URI:", error);
                let errorMessage = `Failed to process image: ${file.name}.`;
                if (error instanceof Error) {
                    errorMessage += ` ${error.message}`;
                }
                toast({ variant: "destructive", title: "Image Processing Error", description: errorMessage });
                setIsSubmitting(false);
                return;
            }
        }
         toast({ title: "Image Compression Complete", description: "All images processed." });
    }
    
    const productPayload: ProductFormPayload & { imageDataUris?: string[] } = {
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        originalPrice: data.originalPrice,
        stock: data.stock,
        tags: data.tags || "",
        status: data.status,
        isFeatured: data.isFeatured,
        images: [], 
        imageDataUris: imageDataUris, 
    };


    if (mode === 'add') {
      console.log("Submitting product payload (add mode):", { ...productPayload, imageDataUris: productPayload.imageDataUris?.map(uri => uri.substring(0,50) + "...")});
      const result = await addProduct(productPayload);
      if (result.success && result.productId) {
        toast({ variant: "default", title: "Product Added!", description: `Product "${data.name}" has been successfully added. ID: ${result.productId.substring(0,8)}...` });
        router.push("/admin/ecommerce-dashboard"); 
      } else {
        let errorDescription = result.error || "An unknown error occurred.";
        if (result.issues) {
            errorDescription = result.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
        }
        toast({ variant: "destructive", title: "Failed to Add Product", description: errorDescription });
      }
    } else {
      toast({ title: "Update Not Implemented", description: "Product update functionality is pending." });
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary">
            {mode === 'add' ? 'Add New Product' : 'Edit Product'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" {...register("name")} placeholder="e.g., Wireless Headphones" className={errors.name ? "border-destructive" : ""} />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="category" className={errors.category ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} placeholder="Detailed product description..." rows={5} className={errors.description ? "border-destructive" : ""} />
            {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input id="price" type="number" step="0.01" {...register("price")} placeholder="e.g., 99.99" className={errors.price ? "border-destructive" : ""} />
              {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="originalPrice">Original Price ($) (Optional)</Label>
              <Input id="originalPrice" type="number" step="0.01" {...register("originalPrice")} placeholder="e.g., 129.99" className={errors.originalPrice ? "border-destructive" : ""} />
              {errors.originalPrice && <p className="text-sm text-destructive mt-1">{errors.originalPrice.message}</p>}
            </div>
            <div>
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input id="stock" type="number" {...register("stock")} placeholder="e.g., 100" className={errors.stock ? "border-destructive" : ""} />
              {errors.stock && <p className="text-sm text-destructive mt-1">{errors.stock.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="imageFiles">Product Images (Max 5, compressed to ~0.5MB each)</Label>
            <Input 
              id="imageFiles" 
              type="file" 
              multiple 
              accept="image/*" 
              {...register("imageFiles")} 
              className={`mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 ${errors.imageFiles ? "border-destructive" : ""}`}
            />
            {errors.imageFiles && <p className="text-sm text-destructive mt-1">{errors.imageFiles.message}</p>}
            
            {(imagePreviews.length > 0) && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {imagePreviews.map((src, index) => (
                    <div key={index} className="relative aspect-square border rounded-md overflow-hidden shadow">
                        <Image src={src} alt={`Preview ${index + 1}`} fill style={{ objectFit: 'cover' }} />
                    </div>
                    ))}
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" {...register("tags")} placeholder="e.g., wireless, audio, noise-cancelling" className={errors.tags ? "border-destructive" : ""} />
              {errors.tags && <p className="text-sm text-destructive mt-1">{errors.tags.message}</p>}
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="status" className={errors.status ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <p className="text-sm text-destructive mt-1">{errors.status.message}</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Controller
              name="isFeatured"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="isFeatured"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isFeatured" className="font-normal">
              Mark as Featured Product
            </Label>
          </div>

        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (mode === 'add' ? <ImagePlus className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />)}
            {mode === 'add' ? 'Add Product' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="ml-auto">
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
