
'use server';

import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import { storage, app as firebaseApp } from '@/lib/firebase'; // Import firebaseApp for checking initialization
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { ObjectId } from 'mongodb';
import type { ProductMongo } from './getProducts'; 

// Schema for validating the form payload coming from the client
const ProductFormSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  category: z.string().min(2, "Category is required."),
  price: z.coerce.number().positive("Price must be a positive number."),
  originalPrice: z.coerce.number().optional().default(0).transform(val => val > 0 ? val : undefined),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  images: z.array(z.string().url("Each image must be a valid data URI before upload or URL after.")).optional().default([]),
  tags: z.string().optional().default("").transform(tags => tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)),
  status: z.enum(['active', 'draft', 'inactive']).default('draft'),
  isFeatured: z.boolean().optional().default(false),
});

export type ProductFormPayload = z.infer<typeof ProductFormSchema>;

export interface NewProductData extends Omit<ProductMongo, '_id' | 'id' | 'rating' | 'reviews' | 'dataAiHint' | 'image'> {
  _id?: ObjectId;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}


export async function addProduct(
  payload: ProductFormPayload & { imageDataUris?: string[] }
): Promise<{ success: boolean; productId?: string; error?: string; issues?: z.ZodIssue[] }> {
  console.log("addProduct server action invoked.");
  console.log("Firebase App Name:", firebaseApp?.name || "Firebase App not initialized or name not available");
  console.log("Firebase Storage Instance:", storage ? "Available" : "Not Available");

  const validationResult = ProductFormSchema.safeParse(payload);

  if (!validationResult.success) {
    console.error("Product validation failed:", validationResult.error.issues);
    return { success: false, error: "Validation failed.", issues: validationResult.error.issues };
  }

  const { imageDataUris, ...productData } = payload;
  const validatedProductData = validationResult.data;
  console.log("Validated product data (excluding images):", validatedProductData);

  if (!storage) {
    console.error("Firebase Storage is not configured or available.");
    return { success: false, error: "Firebase Storage is not configured." };
  }

  const newProductId = new ObjectId();
  console.log("Generated new Product ID:", newProductId.toString());
  const uploadedImageUrls: string[] = [];

  if (imageDataUris && imageDataUris.length > 0) {
    console.log(`Found ${imageDataUris.length} image data URIs to upload.`);
    try {
      for (let i = 0; i < imageDataUris.length; i++) {
        const dataUri = imageDataUris[i];
        if (!dataUri.startsWith('data:image')) {
          console.warn(`Skipping invalid data URI for image ${i + 1}. URI starts with: ${dataUri.substring(0, 30)}`);
          continue;
        }
        const imageName = `image_${i + 1}_${Date.now()}`; // Simple unique name
        const storagePath = `product_images/${newProductId.toString()}/${imageName}`;
        const storageRef = ref(storage, storagePath);
        
        console.log(`Attempting to upload image ${i+1} to Firebase Storage path: ${storagePath}`);
        
        // Log a snippet of the data URI to check its integrity (don't log the whole thing)
        console.log(`Data URI (first 60 chars): ${dataUri.substring(0, 60)}...`);

        const uploadResult = await uploadString(storageRef, dataUri, 'data_url');
        console.log(`Successfully uploaded image ${i+1}. Full path: ${uploadResult.ref.fullPath}`);
        
        const downloadURL = await getDownloadURL(uploadResult.ref);
        uploadedImageUrls.push(downloadURL);
        console.log(`Retrieved download URL for image ${i+1}: ${downloadURL}`);
      }
    } catch (e: any) {
      console.error("Error during image upload loop in Firebase Storage:", e);
      // Log more details from the error object if possible
      if (e.code) console.error("Firebase Storage Error Code:", e.code);
      if (e.message) console.error("Firebase Storage Error Message:", e.message);
      if (e.serverResponse) console.error("Firebase Storage Server Response:", e.serverResponse);
      return { success: false, error: `Image upload failed: ${e.message}` };
    }
  } else {
    console.log("No image data URIs provided for upload.");
  }
  
  const mainImage = uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : "https://placehold.co/400x400.png";
  console.log("Main image for product:", mainImage);


  const productToInsert: NewProductData = {
    ...validatedProductData,
    _id: newProductId,
    images: uploadedImageUrls,
    image: mainImage,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  if (!productToInsert.originalPrice) delete productToInsert.originalPrice;

  console.log("Product document to be inserted into MongoDB:", JSON.stringify(productToInsert, null, 2));

  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection<NewProductData>('products');
    
    console.log("Attempting to insert product into MongoDB...");
    const result = await productsCollection.insertOne(productToInsert);

    if (!result.insertedId) {
      console.error("MongoDB insert operation failed to return an insertedId.");
      throw new Error("MongoDB insert operation failed to return an insertedId.");
    }
    
    const insertedIdString = result.insertedId.toString();
    console.log("Product added successfully to MongoDB with ID:", insertedIdString);
    return { success: true, productId: insertedIdString };

  } catch (e: any) {
    console.error("Error adding product to MongoDB:", e);
    // TODO: Consider deleting uploaded images from Firebase Storage if DB insert fails (cleanup)
    return { success: false, error: `Database operation failed: ${e.message}` };
  }
}
