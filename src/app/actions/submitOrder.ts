
'use server';

import { storage } from '@/lib/firebase';
import { connectToDatabase } from '@/lib/mongodb';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import type { Address } from '@/components/features/xerox/DeliveryAddress';
import type { ObjectId } from 'mongodb';
import type { ServiceType, PhotoType } from '@/components/features/xerox/XeroxForm'; // Import new types

// Function to generate a unique pickup code
const generatePickupCode = (): string => {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `XRU-${randomNumber}`;
};

export interface RazorpayPaymentDetails {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Interface for data to be stored in MongoDB
export interface OrderDataMongo {
  _id?: ObjectId;
  serviceType: ServiceType; 
  fileName: string | null;
  
  // Document specific (optional)
  numPages?: string;
  paperSize?: 'A4' | 'Letter' | 'Legal';
  printSides?: 'single' | 'double';
  layout?: '1up' | '2up';
  
  // Photo specific (optional)
  photoType?: PhotoType;
  // photoPaperFinish?: 'glossy' | 'matte'; // Future enhancement

  // Common
  numCopies: string; // For docs: num sets; For photos: num prints/sheets
  printColor: 'color' | 'bw';
  
  deliveryMethod: 'pickup' | 'home_delivery';
  deliveryAddress: Address; 
  pickupCenter?: string; 
  pickupCode: string; 

  totalCost: number;
  status: string; 
  createdAt: Date;
  fileDownloadURL?: string | null; 
  
  userId: string; 
  userEmail: string; 
  userName: string; 

  paymentMethod: 'cod' | 'razorpay'; 
  paymentDetails?: RazorpayPaymentDetails; 
}

// This is the type for data coming from the form/payment page
export type OrderFormPayload = Omit<OrderDataMongo, 'status' | 'createdAt' | '_id' | 'pickupCode'> & {
  fileDataUri?: string | null;
};


export async function submitOrderToMongoDB(order: OrderFormPayload): Promise<{success: boolean, orderId?: string, pickupCode?: string, error?: string}> {
  console.log("submitOrderToMongoDB called with order payload:", { ...order, fileDataUri: order.fileDataUri ? 'PRESENT' : 'ABSENT', paymentMethod: order.paymentMethod, serviceType: order.serviceType });

  if (!order.userId || !order.userEmail || !order.userName) {
    console.error("User authentication details (userId, userEmail, userName) are missing.");
    return { success: false, error: "User authentication details are required. Please sign in." };
  }

  if (!storage) {
    console.error("Firebase Storage client is not initialized.");
    return { success: false, error: "Firebase Storage service is not configured properly." };
  }
  
  if (order.deliveryMethod === 'home_delivery' && (!order.deliveryAddress || !order.deliveryAddress.street || !order.deliveryAddress.city || !order.deliveryAddress.state || !order.deliveryAddress.zip || !order.deliveryAddress.country)) {
    console.error("Incomplete delivery address for home delivery:", order.deliveryAddress);
    return { success: false, error: "Incomplete delivery address for home delivery." };
  }
  if (order.deliveryMethod === 'pickup' && !order.pickupCenter) {
    console.error("Pickup center not selected for pickup method.");
    return { success: false, error: "Pickup center is required." };
  }


  let fileDownloadURL: string | null = null;
  const orderUserId = order.userId; // Capture userId for potential error message
  
  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDataMongo>("orders");

    const { fileDataUri, fileName: originalFileName, ...restOfOrderPayload } = order;

    if (fileDataUri && originalFileName) {
      if (typeof fileDataUri !== 'string' || !fileDataUri.startsWith('data:')) {
        console.error("Invalid fileDataUri format.");
        return { success: false, error: "Invalid file data format." };
      }
      const sanitizedFileName = originalFileName.replace(/\s+/g, '_');
      const storagePath = `user_uploads/${orderUserId}/${Date.now()}_${sanitizedFileName}`;
      
      console.log(`Attempting to upload file to Firebase Storage. Path: '${storagePath}'. UserID for path: '${orderUserId}'`);
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadString(storageRef, fileDataUri, 'data_url');
      console.log("Successfully uploaded file to Firebase Storage:", uploadResult.ref.fullPath);
      
      fileDownloadURL = await getDownloadURL(uploadResult.ref);
      console.log("Retrieved download URL:", fileDownloadURL);
    } else if (!originalFileName && fileDataUri) {
        console.warn("fileDataUri present but originalFileName is null/empty.");
    } else if (originalFileName && !fileDataUri) {
        console.error("fileName present but fileDataUri is missing.");
        return { success: false, error: "File data is missing, cannot upload."};
    }
    
    const newPickupCode = generatePickupCode();
    const initialStatus = order.paymentMethod === 'razorpay' && order.paymentDetails ? 'paid' : 'pending';

    const orderDocument: Omit<OrderDataMongo, '_id'> = {
      ...restOfOrderPayload, 
      fileName: originalFileName,
      status: initialStatus, 
      createdAt: new Date(),
      fileDownloadURL: fileDownloadURL,
      pickupCode: newPickupCode,
      deliveryAddress: order.deliveryMethod === 'home_delivery' ? order.deliveryAddress : { street: '', city: '', state: '', zip: '', country: ''},
      pickupCenter: order.deliveryMethod === 'pickup' ? order.pickupCenter : undefined,
      paymentMethod: order.paymentMethod,
      paymentDetails: order.paymentDetails,
      serviceType: order.serviceType,
      numPages: order.serviceType === 'document' ? order.numPages : undefined,
      paperSize: order.serviceType === 'document' ? order.paperSize : undefined,
      printSides: order.serviceType === 'document' ? order.printSides : undefined,
      layout: order.serviceType === 'document' ? order.layout : undefined,
      photoType: order.serviceType === 'photo' ? order.photoType : undefined,
    };

    console.log("Attempting to insert document into MongoDB 'orders':", JSON.stringify(orderDocument, null, 2));
    const insertResult = await ordersCollection.insertOne(orderDocument);
    
    if (!insertResult.insertedId) {
      console.error("MongoDB insert operation failed to return an insertedId.");
      throw new Error("Failed to save order to database.");
    }
    
    const orderId = insertResult.insertedId.toString();
    console.log("Successfully inserted document into MongoDB with ID:", orderId);
    
    return { success: true, orderId: orderId, pickupCode: newPickupCode };

  } catch (e: any) { 
    console.error("Error processing order with MongoDB/Firebase Storage: ", e);
    
    let errorMessage = "Failed to submit order.";
    if (e instanceof Error) errorMessage += ` Details: ${e.message}`;
    else if (typeof e === 'string') errorMessage += ` Details: ${e}`;
    
    if (e?.code === 'storage/unauthorized' || (e?.message && e.message.includes('storage/unauthorized'))) {
        errorMessage = `Firebase Storage Permission Denied. User ID used for path: '${orderUserId}'. Original error: ${e.message}`;
        console.error(`Firebase Storage Unauthorized Access: Attempted to write with userId '${orderUserId}'. Path like 'user_uploads/${orderUserId}/...'`);
    } else if (e?.code) {
        errorMessage += ` (Code: ${e.code})`;
    } else if (e?.codeName) {
        errorMessage += ` (Code Name: ${e.codeName})`;
    }
    
    console.error("Final error message to client:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

