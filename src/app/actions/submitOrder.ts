
'use server';

import { storage } from '@/lib/firebase'; // Firebase Storage is still used
import { connectToDatabase } from '@/lib/mongodb';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import type { Address } from '@/components/features/xerox/DeliveryAddress';
import type { ObjectId } from 'mongodb';

// Interface for data to be stored in MongoDB
export interface OrderDataMongo {
  _id?: ObjectId; // Optional because it's assigned by MongoDB on insert
  fileName: string | null;
  numPages: string;
  numCopies: string;
  printColor: 'color' | 'bw';
  paperSize: 'A4' | 'Letter' | 'Legal';
  printSides: 'single' | 'double';
  layout: '1up' | '2up';
  deliveryAddress: Address;
  totalCost: number;
  status: string;
  createdAt: Date; // Changed from Firestore Timestamp to JS Date
  pdfDownloadURL?: string | null; // URL of the uploaded PDF in Firebase Storage
}

// This is the type for data coming from the form, without MongoDB specifics
export type OrderFormPayload = Omit<OrderDataMongo, 'status' | 'createdAt' | 'pdfDownloadURL' | '_id'> & {
  fileDataUri?: string | null; // Base64 data URI of the file to upload
};


export async function submitOrderToMongoDB(order: OrderFormPayload): Promise<{success: boolean, orderId?: string, error?: string}> {
  console.log("submitOrderToMongoDB called with order payload:", { ...order, fileDataUri: order.fileDataUri ? 'PRESENT' : 'ABSENT' });

  if (!storage) {
    console.error("Firebase Storage client is not initialized. Check src/lib/firebase.ts configuration.");
    return { success: false, error: "Firebase Storage service is not configured properly." };
  }
  
  if (!order.deliveryAddress || !order.deliveryAddress.street || !order.deliveryAddress.city || !order.deliveryAddress.state || !order.deliveryAddress.zip || !order.deliveryAddress.country) {
    console.error("Incomplete delivery address provided:", order.deliveryAddress);
    return { success: false, error: "Incomplete delivery address. All address fields are required." };
  }

  let pdfDownloadURL: string | null = null;
  const tempOrderIdForStorage = new (require('mongodb').ObjectId)().toString(); // Generate a temporary ID for storage path if needed

  try {
    const { client, db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDataMongo>("orders");

    // Destructure payload to separate file data from other order details
    const { fileDataUri, fileName: originalFileName, ...restOfOrderPayload } = order;

    // 1. If there's a file, upload it to Firebase Storage using a unique ID in the path
    if (fileDataUri && originalFileName) {
      // Sanitize filename for storage path
      const sanitizedFileName = originalFileName.replace(/\s+/g, '_');
      // Using a temp ID or a future MongoDB _id. For simplicity, let's use a new ObjectId for path uniqueness.
      const storagePath = `user_documents/${tempOrderIdForStorage}/${sanitizedFileName}`;
      
      console.log(`Attempting to upload file to Firebase Storage at path: ${storagePath}...`);
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadString(storageRef, fileDataUri, 'data_url');
      console.log("Successfully uploaded file to Firebase Storage. Ref:", uploadResult.ref.fullPath);
      
      console.log("Attempting to get download URL for the uploaded file...");
      pdfDownloadURL = await getDownloadURL(uploadResult.ref);
      console.log("Successfully retrieved download URL:", pdfDownloadURL);
    }
    
    // 2. Prepare the order document for MongoDB
    const orderDocument: Omit<OrderDataMongo, '_id'> = {
      ...restOfOrderPayload,
      fileName: originalFileName,
      status: 'pending', // Initial status
      createdAt: new Date(), // Use current date for MongoDB
      pdfDownloadURL: pdfDownloadURL, // Add the PDF URL if available
    };

    console.log("Attempting to insert document into MongoDB 'orders' collection with data:", orderDocument);
    const insertResult = await ordersCollection.insertOne(orderDocument);
    
    if (!insertResult.insertedId) {
      console.error("MongoDB insert operation failed to return an insertedId.");
      throw new Error("Failed to save order to database.");
    }
    
    const orderId = insertResult.insertedId.toString();
    console.log("Successfully inserted document into MongoDB with ID:", orderId);
    
    console.log("Order processing completed for MongoDB ID: ", orderId);
    return { success: true, orderId: orderId };

  } catch (e: any) { 
    console.error("Error processing order with MongoDB/Firebase Storage: ", e);
    
    let errorMessage = "Failed to submit order.";
    if (e instanceof Error) {
        errorMessage += ` Details: ${e.message}`;
    } else if (typeof e === 'string') {
        errorMessage += ` Details: ${e}`;
    }
    // MongoDB errors might have a 'code' or 'codeName'
    if (e && e.code) {
        errorMessage += ` (Code: ${e.code})`;
    } else if (e && e.codeName) {
        errorMessage += ` (Code Name: ${e.codeName})`;
    }
    
    console.error("Final error message to be returned to client:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
