
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, type Timestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import type { Address } from '@/components/features/xerox/DeliveryAddress';

// Exporting OrderData so it can be reused in the dashboard
export interface OrderData {
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
  createdAt: Timestamp | any; // For serverTimestamp() or actual Timestamp
  pdfDownloadURL?: string | null; // URL of the uploaded PDF in Firebase Storage
}

// This is the type for data coming from the form
export type OrderFormPayload = Omit<OrderData, 'status' | 'createdAt' | 'pdfDownloadURL'> & {
  fileDataUri?: string | null; // Base64 data URI of the file to upload
};


export async function submitOrderToFirebase(order: OrderFormPayload): Promise<{success: boolean, orderId?: string, error?: string}> {
  console.log("submitOrderToFirebase called with order payload:", { ...order, fileDataUri: order.fileDataUri ? 'PRESENT' : 'ABSENT' });

  if (!db || !storage) {
    console.error("Firebase Firestore or Storage client is not initialized. Check src/lib/firebase.ts configuration.");
    return { success: false, error: "Firebase service is not configured properly." };
  }
  
  if (!order.deliveryAddress || !order.deliveryAddress.street || !order.deliveryAddress.city || !order.deliveryAddress.state || !order.deliveryAddress.zip || !order.deliveryAddress.country) {
    console.error("Incomplete delivery address provided:", order.deliveryAddress);
    return { success: false, error: "Incomplete delivery address. All address fields are required." };
  }

  let orderId: string;
  let pdfDownloadURL: string | null = null;
  let docRefForWrite;

  try {
    // Destructure payload to separate file data from other order details
    const { fileDataUri, fileName: originalFileName, ...restOfOrderPayload } = order;

    // 1. Create the Firestore document *first* but without the PDF URL yet.
    // This gives us the ID to use in the storage path.
    const initialOrderData = {
      ...restOfOrderPayload,
      fileName: originalFileName, // Keep original file name
      status: originalFileName && fileDataUri ? 'pending_upload' : 'pending', // Temp status if file exists
      createdAt: serverTimestamp(),
      pdfDownloadURL: null, // Explicitly null initially
    };

    console.log("Attempting to add document to Firestore 'orders' collection with data:", initialOrderData);
    docRefForWrite = await addDoc(collection(db, "orders"), initialOrderData);
    orderId = docRefForWrite.id;
    console.log("Successfully added document to Firestore with ID:", orderId);

    // 2. If there's a file, upload it to Firebase Storage using the orderId in the path
    if (fileDataUri && originalFileName) {
      // Sanitize filename for storage path if necessary, e.g., replace spaces
      const sanitizedFileName = originalFileName.replace(/\s+/g, '_');
      const storagePath = `user_documents/${orderId}/${sanitizedFileName}`;
      
      console.log(`Attempting to upload file to Firebase Storage at path: ${storagePath}...`);
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadString(storageRef, fileDataUri, 'data_url');
      console.log("Successfully uploaded file to Firebase Storage. Ref:", uploadResult.ref.fullPath);
      
      console.log("Attempting to get download URL for the uploaded file...");
      pdfDownloadURL = await getDownloadURL(uploadResult.ref);
      console.log("Successfully retrieved download URL:", pdfDownloadURL);

      // 3. Update the Firestore document with the pdfDownloadURL and final status
      const updateData = {
        pdfDownloadURL: pdfDownloadURL,
        status: 'pending' // Final pending status
      };
      console.log("Attempting to update Firestore document with ID", orderId, "with data:", updateData);
      await updateDoc(docRefForWrite, updateData);
      console.log("Successfully updated Firestore document with PDF URL and status.");

    } else if (initialOrderData.status === 'pending_upload') {
      // If it was 'pending_upload' but somehow no fileDataUri, correct status
      console.log("Order was 'pending_upload' but no fileDataUri present. Correcting status to 'pending' for order ID:", orderId);
      await updateDoc(docRefForWrite, {
        status: 'pending'
      });
      console.log("Successfully corrected status for order ID:", orderId);
    }
    
    console.log("Order processing completed for Firebase ID: ", orderId);
    return { success: true, orderId: orderId };

  } catch (e: any) { 
    console.error("Error processing order with Firebase: ", e);
    
    let errorMessage = "Failed to submit order.";
    
    if (e && typeof e.message === 'string') {
      errorMessage += ` Details: ${e.message}`;
    } else if (typeof e === 'string') {
      errorMessage += ` Details: ${e}`;
    }
    if (e && typeof e.code === 'string') {
        errorMessage += ` (Code: ${e.code})`;
    }
    
    console.error("Final error message to be returned to client:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
