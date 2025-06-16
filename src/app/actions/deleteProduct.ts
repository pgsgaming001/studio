
'use server';

import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import { storage } from '@/lib/firebase';
import { ref, deleteObject } from 'firebase/storage';
import type { ProductMongo } from './getProducts'; // Assuming ProductMongo has the 'images' array

export async function deleteProduct(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`deleteProduct server action invoked for productId: ${productId}`);

  if (!productId || !ObjectId.isValid(productId)) {
    console.error('Invalid Product ID format for deletion.');
    return { success: false, error: 'Invalid Product ID format.' };
  }

  if (!storage) {
    console.error("Firebase Storage is not configured or available for deleteProduct.");
    return { success: false, error: "Firebase Storage is not configured." };
  }

  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection<ProductMongo>('products');

    // 1. Fetch the product to get its image URLs
    const productToDelete = await productsCollection.findOne({ _id: new ObjectId(productId) });

    if (!productToDelete) {
      console.warn(`Product with ID ${productId} not found for deletion.`);
      return { success: false, error: 'Product not found.' };
    }

    // 2. Delete images from Firebase Storage
    // The 'images' array should contain full Firebase Storage download URLs
    const imageDeletionPromises: Promise<void>[] = [];
    if (productToDelete.images && productToDelete.images.length > 0) {
      console.log(`Attempting to delete ${productToDelete.images.length} images from Firebase Storage.`);
      productToDelete.images.forEach(imageUrl => {
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
          try {
            const imageRef = ref(storage, imageUrl); // refFromURL could also be used if directly passing URL
            console.log(`Creating delete promise for image: ${imageUrl}`);
            imageDeletionPromises.push(
              deleteObject(imageRef)
                .then(() => console.log(`Successfully deleted image: ${imageUrl}`))
                .catch(e => {
                  // Log specific image deletion error but don't necessarily fail the whole product deletion
                  // if some images are already gone or permissions are weird for a specific file.
                  console.error(`Failed to delete image ${imageUrl} from Firebase Storage:`, e);
                })
            );
          } catch (e) {
             console.error(`Error creating storage reference for image URL ${imageUrl}:`, e);
          }
        } else {
            console.warn(`Skipping invalid or non-Firebase Storage URL for deletion: ${imageUrl}`);
        }
      });

      // Wait for all image deletion attempts to complete
      await Promise.allSettled(imageDeletionPromises);
      console.log("Finished all image deletion attempts.");
    } else {
      console.log("No images associated with this product to delete from Firebase Storage.");
    }

    // 3. Delete the product document from MongoDB
    console.log(`Attempting to delete product document with ID ${productId} from MongoDB.`);
    const result = await productsCollection.deleteOne({ _id: new ObjectId(productId) });

    if (result.deletedCount === 1) {
      console.log(`Product ${productId} successfully deleted from MongoDB.`);
      return { success: true };
    } else {
      console.warn(`Product ${productId} was not found in MongoDB during deletion, or not deleted.`);
      // This might happen if it was deleted in another process between fetching and deleting
      return { success: false, error: 'Product could not be deleted from database (already removed or error).' };
    }
  } catch (e: any) {
    console.error(`Error during product deletion process for ID ${productId}:`, e);
    return { success: false, error: `Product deletion failed: ${e.message}` };
  }
}
