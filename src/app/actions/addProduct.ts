
'use server';

import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import { storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { ObjectId } from 'mongodb';
import type { ProductMongo } from './getProducts'; // Assuming ProductMongo from getProducts can be reused or adapted

// Schema for validating the form payload coming from the client
const ProductFormSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  category: z.string().min(2, "Category is required."),
  price: z.coerce.number().positive("Price must be a positive number."),
  originalPrice: z.coerce.number().optional().default(0).transform(val => val > 0 ? val : undefined), // Store as undefined if not > 0
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  images: z.array(z.string().url("Each image must be a valid data URI before upload or URL after.")).optional().default([]), // Client sends data URIs
  tags: z.string().optional().default("").transform(tags => tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)),
  status: z.enum(['active', 'draft', 'inactive']).default('draft'),
  isFeatured: z.boolean().optional().default(false),
});

export type ProductFormPayload = z.infer<typeof ProductFormSchema>;

// Interface for the data to be stored in MongoDB, aligning with ProductMongo if possible
// This extends ProductMongo to ensure all fields are covered
export interface NewProductData extends Omit<ProductMongo, '_id' | 'id' | 'rating' | 'reviews' | 'dataAiHint' | 'image'> {
  // ProductMongo already has: name, description, price, originalPrice, images (array of URLs), category, stock, status, isFeatured, tags
  // We will add createdAt and updatedAt
  _id?: ObjectId; // Will be generated
  image?: string; // Main image, derived from images[0]
  createdAt: Date;
  updatedAt: Date;
}


export async function addProduct(
  payload: ProductFormPayload & { imageDataUris?: string[] } // imageDataUris for actual file data
): Promise<{ success: boolean; productId?: string; error?: string; issues?: z.ZodIssue[] }> {
  const validationResult = ProductFormSchema.safeParse(payload);

  if (!validationResult.success) {
    console.error("Product validation failed:", validationResult.error.issues);
    return { success: false, error: "Validation failed.", issues: validationResult.error.issues };
  }

  const { imageDataUris, ...productData } = payload; // Separate image data from other product data
  const validatedProductData = validationResult.data; // Use validated and transformed data

  if (!storage) {
    return { success: false, error: "Firebase Storage is not configured." };
  }

  const newProductId = new ObjectId();
  const uploadedImageUrls: string[] = [];

  if (imageDataUris && imageDataUris.length > 0) {
    try {
      for (let i = 0; i < imageDataUris.length; i++) {
        const dataUri = imageDataUris[i];
        if (!dataUri.startsWith('data:image')) {
          // This check might be redundant if client ensures correct format, but good for safety
          console.warn(`Skipping invalid data URI for image ${i + 1}`);
          continue;
        }
        const imageName = `image_${i + 1}_${Date.now()}`; // Simple unique name
        const storagePath = `product_images/${newProductId.toString()}/${imageName}`;
        const storageRef = ref(storage, storagePath);
        
        console.log(`Uploading image ${i+1} to ${storagePath}`);
        const uploadResult = await uploadString(storageRef, dataUri, 'data_url');
        const downloadURL = await getDownloadURL(uploadResult.ref);
        uploadedImageUrls.push(downloadURL);
        console.log(`Uploaded image ${i+1}, URL: ${downloadURL}`);
      }
    } catch (e: any) {
      console.error("Error uploading images to Firebase Storage:", e);
      return { success: false, error: `Image upload failed: ${e.message}` };
    }
  }
  
  const mainImage = uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : "https://placehold.co/400x400.png";


  const productToInsert: NewProductData = {
    ...validatedProductData, // Spread the validated and transformed data
    _id: newProductId,
    images: uploadedImageUrls, // Override with actual URLs
    image: mainImage, // Set the main image
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  // Ensure optional fields are handled correctly
  if (!productToInsert.originalPrice) delete productToInsert.originalPrice;


  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection<NewProductData>('products');
    
    const result = await productsCollection.insertOne(productToInsert);

    if (!result.insertedId) {
      throw new Error("MongoDB insert operation failed to return an insertedId.");
    }
    
    console.log("Product added successfully to MongoDB with ID:", result.insertedId.toString());
    return { success: true, productId: result.insertedId.toString() };

  } catch (e: any) {
    console.error("Error adding product to MongoDB:", e);
    // TODO: Consider deleting uploaded images from Firebase Storage if DB insert fails (cleanup)
    return { success: false, error: `Database operation failed: ${e.message}` };
  }
}
