
'use server';

import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { ProductMongo } from './getProducts'; // Re-use for DB interaction

// Schema for validating the updatable (non-image) fields
const UpdateProductDataSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  category: z.string().min(2, "Category is required."),
  price: z.coerce.number().positive("Price must be a positive number."),
  originalPrice: z.coerce.number().optional().default(0).transform(val => val > 0 ? val : undefined),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
  tags: z.string().optional().default("").transform(tags => tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)),
  status: z.enum(['active', 'draft', 'inactive']).default('draft'),
  isFeatured: z.boolean().optional().default(false),
});

export type UpdateProductDataPayload = z.infer<typeof UpdateProductDataSchema>;

export async function updateProduct(
  productId: string,
  payload: UpdateProductDataPayload
): Promise<{ success: boolean; error?: string; issues?: z.ZodIssue[] }> {
  console.log(`updateProduct server action invoked for productId: ${productId}`);

  if (!productId || !ObjectId.isValid(productId)) {
    console.error('Invalid Product ID format for update.');
    return { success: false, error: 'Invalid Product ID format.' };
  }

  const validationResult = UpdateProductDataSchema.safeParse(payload);
  if (!validationResult.success) {
    console.error("Product update validation failed:", validationResult.error.issues);
    return { success: false, error: "Validation failed.", issues: validationResult.error.issues };
  }

  const validatedData = validationResult.data;
  console.log("Validated product data for update:", validatedData);

  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection<ProductMongo>('products');

    const updateDocument: Partial<ProductMongo> = {
      ...validatedData,
      updatedAt: new Date(),
    };
    
    // Handle optional originalPrice: if not provided or transformed to undefined, remove it from update.
    if (validatedData.originalPrice === undefined) {
      // If we want to explicitly remove it if it was, e.g. 0 or empty string from form
      // delete updateDocument.originalPrice; // This will remove it if it exists from spread
      // Alternatively, if validatedData.originalPrice is undefined, it won't be $set.
      // If we want to ensure it's unset if it was 0 in the form
      // $set: { originalPrice: undefined } would not work as expected to remove field. Use $unset.
      // For now, the current approach correctly sets it if positive, or it won't be in updateDoc if undefined.
    }


    // Construct update operation. For now, we only $set.
    // Image handling (add/remove) would require more complex logic here (e.g., $push, $pull, updating main 'image' field).
    // That is deferred for this implementation.
    const updateOperation = {
      $set: updateDocument,
    };
    // If originalPrice was provided as 0 and we want to remove it from the document
    if (payload.originalPrice !== undefined && payload.originalPrice <= 0) {
       (updateOperation as any).$unset = { originalPrice: "" }; // $unset removes the field
       delete (updateOperation.$set as any).originalPrice; // Don't try to set it to undefined
    }


    console.log("Attempting to update product in MongoDB. ProductID:", productId, "UpdateData:", JSON.stringify(updateOperation, null, 2));
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(productId) },
      updateOperation
    );

    if (result.matchedCount === 0) {
      console.warn(`Product with ID ${productId} not found for update.`);
      return { success: false, error: 'Product not found.' };
    }

    if (result.modifiedCount === 0 && result.matchedCount === 1) {
      console.log(`Product ${productId} found, but no fields were changed by the update.`);
      // This isn't necessarily an error, could be a "save" with no actual changes.
      // For UX, it might be better to indicate "No changes detected".
      return { success: true, error: "No changes detected to update." }; 
    }
    
    console.log(`Product ${productId} updated successfully. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
    return { success: true };

  } catch (e: any) {
    console.error(`Error updating product ${productId} in MongoDB:`, e);
    return { success: false, error: `Database operation failed: ${e.message}` };
  }
}
