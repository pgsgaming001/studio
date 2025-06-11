
'use server';

import { storage } from '@/lib/firebase';
import { connectToDatabase } from '@/lib/mongodb';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import type { Address } from '@/components/features/xerox/DeliveryAddress';
import type { ObjectId } from 'mongodb';

// Function to generate a unique pickup code
const generatePickupCode = (): string => {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `XRU-${randomNumber}`;
};

// Interface for data to be stored in MongoDB
export interface OrderDataMongo {
  _id?: ObjectId;
  fileName: string | null;
  numPages: string;
  numCopies: string;
  printColor: 'color' | 'bw';
  paperSize: 'A4' | 'Letter' | 'Legal';
  printSides: 'single' | 'double';
  layout: '1up' | '2up';
  
  deliveryMethod: 'pickup' | 'home_delivery';
  deliveryAddress: Address; // Used for home_delivery, can be minimal for pickup
  pickupCenter?: string; // Only if deliveryMethod is 'pickup'
  pickupCode: string; // Always generated

  totalCost: number;
  status: string; // e.g., 'pending', 'processing', 'awaiting_pickup', 'shipped', 'delivered'
  createdAt: Date;
  fileDownloadURL?: string | null; // Renamed from pdfDownloadURL
  
  userId?: string;
  userEmail?: string;
  userName?: string;
}

// This is the type for data coming from the form/payment page
export type OrderFormPayload = Omit<OrderDataMongo, 'status' | 'createdAt' | '_id' | 'pickupCode'> & {
  fileDataUri?: string | null;
  // pickupCode is generated server-side
};


export async function submitOrderToMongoDB(order: OrderFormPayload): Promise<{success: boolean, orderId?: string, pickupCode?: string, error?: string}> {
  console.log("submitOrderToMongoDB called with order payload:", { ...order, fileDataUri: order.fileDataUri ? 'PRESENT' : 'ABSENT', userId: order.userId });

  if (!storage) {
    console.error("Firebase Storage client is not initialized. Check src/lib/firebase.ts configuration.");
    return { success: false, error: "Firebase Storage service is not configured properly." };
  }
  
  if (order.deliveryMethod === 'home_delivery' && (!order.deliveryAddress || !order.deliveryAddress.street || !order.deliveryAddress.city || !order.deliveryAddress.state || !order.deliveryAddress.zip || !order.deliveryAddress.country)) {
    console.error("Incomplete delivery address provided for home delivery:", order.deliveryAddress);
    return { success: false, error: "Incomplete delivery address for home delivery. All address fields are required." };
  }
  if (order.deliveryMethod === 'pickup' && !order.pickupCenter) {
    console.error("Pickup center not selected for pickup method.");
    return { success: false, error: "Pickup center is required for pickup method." };
  }


  let fileDownloadURL: string | null = null;
  const tempOrderIdForStorage = new (require('mongodb').ObjectId)().toString();

  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDataMongo>("orders");

    const { fileDataUri, fileName: originalFileName, ...restOfOrderPayload } = order;

    if (fileDataUri && originalFileName) {
      const sanitizedFileName = originalFileName.replace(/\s+/g, '_');
      const storagePath = `user_documents/${order.userId || tempOrderIdForStorage}/${Date.now()}_${sanitizedFileName}`;
      
      console.log(`Attempting to upload file to Firebase Storage at path: ${storagePath}...`);
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadString(storageRef, fileDataUri, 'data_url');
      console.log("Successfully uploaded file to Firebase Storage. Ref:", uploadResult.ref.fullPath);
      
      console.log("Attempting to get download URL for the uploaded file...");
      fileDownloadURL = await getDownloadURL(uploadResult.ref);
      console.log("Successfully retrieved download URL:", fileDownloadURL);
    }
    
    const newPickupCode = generatePickupCode();

    const orderDocument: Omit<OrderDataMongo, '_id'> = {
      ...restOfOrderPayload,
      fileName: originalFileName,
      status: 'pending', 
      createdAt: new Date(),
      fileDownloadURL: fileDownloadURL,
      pickupCode: newPickupCode,
      // Ensure deliveryAddress is empty/default if not home delivery, or handle in form
      deliveryAddress: order.deliveryMethod === 'home_delivery' ? order.deliveryAddress : { street: '', city: '', state: '', zip: '', country: ''},
      pickupCenter: order.deliveryMethod === 'pickup' ? order.pickupCenter : undefined,
    };

    console.log("Attempting to insert document into MongoDB 'orders' collection with data:", orderDocument);
    const insertResult = await ordersCollection.insertOne(orderDocument);
    
    if (!insertResult.insertedId) {
      console.error("MongoDB insert operation failed to return an insertedId.");
      throw new Error("Failed to save order to database.");
    }
    
    const orderId = insertResult.insertedId.toString();
    console.log("Successfully inserted document into MongoDB with ID:", orderId);
    
    console.log("Order processing completed for MongoDB ID: ", orderId, "Pickup Code:", newPickupCode);
    return { success: true, orderId: orderId, pickupCode: newPickupCode };

  } catch (e: any) { 
    console.error("Error processing order with MongoDB/Firebase Storage: ", e);
    
    let errorMessage = "Failed to submit order.";
    if (e instanceof Error) {
        errorMessage += ` Details: ${e.message}`;
    } else if (typeof e === 'string') {
        errorMessage += ` Details: ${e}`;
    }
    if (e && e.code) {
        errorMessage += ` (Code: ${e.code})`;
    } else if (e && e.codeName) {
        errorMessage += ` (Code Name: ${e.codeName})`;
    }
    
    console.error("Final error message to be returned to client:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
    