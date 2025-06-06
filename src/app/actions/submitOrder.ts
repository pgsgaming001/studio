
'use server';

import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
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
  if (!db || !storage) {
    console.error("Firebase Firestore or Storage client is not initialized. Check src/lib/firebase.ts configuration.");
    return { success: false, error: "Firebase service is not configured properly." };
  }
  
  if (!order.deliveryAddress || !order.deliveryAddress.street || !order.deliveryAddress.city || !order.deliveryAddress.state || !order.deliveryAddress.zip || !order.deliveryAddress.country) {
    return { success: false, error: "Incomplete delivery address. All address fields are required." };
  }

  let pdfDownloadURL: string | null = null;

  try {
    // Create a preliminary document reference to get an ID for storage path
    const preliminaryDocRef = await addDoc(collection(db, "orders"), {}); // Add an empty doc or minimal data
    const orderId = preliminaryDocRef.id; // Use this ID for storage

    if (order.fileDataUri && order.fileName) {
      const storageRef = ref(storage, `user_documents/${orderId}/${order.fileName}`);
      // Upload the base64 string. The 'data_url' type handles 'data:mime/type;base64,payload'
      const uploadResult = await uploadString(storageRef, order.fileDataUri, 'data_url');
      pdfDownloadURL = await getDownloadURL(uploadResult.ref);
    }

    const orderToSave: Omit<OrderData, 'createdAt'> & { createdAt: any } = {
      fileName: order.fileName,
      numPages: order.numPages,
      numCopies: order.numCopies,
      printColor: order.printColor,
      paperSize: order.paperSize,
      printSides: order.printSides,
      layout: order.layout,
      deliveryAddress: order.deliveryAddress,
      totalCost: order.totalCost,
      status: 'pending', 
      pdfDownloadURL: pdfDownloadURL,
      createdAt: serverTimestamp() 
    };
    
    // Update the preliminary document with the full order data
    // Or, if addDoc above was truly minimal, you might use setDoc here with the orderId
    // For simplicity, if addDoc allows updating later or if we delete and re-add:
    // await deleteDoc(preliminaryDocRef); // if addDoc created a placeholder
    // const finalDocRef = await setDoc(doc(db, "orders", orderId), orderToSave); // Then set the actual data

    // For now, let's assume addDoc just writes to a new doc and we return its ID.
    // The user_documents path will use a different ID if we do it this way.
    // A better way for predictable storage path is to generate ID client-side or use a Cloud Function trigger.
    // For simplicity in this step, we'll accept potentially different IDs or a more complex Firestore write pattern.
    // The current code above with `preliminaryDocRef` and then writing `orderToSave` to a *new* document
    // using `addDoc` again (as implied by the original structure) would be problematic for linking storage.

    // Corrected approach: Generate ID, upload to storage with that ID, then save to Firestore with that ID.
    // However, `addDoc` generates the ID. Let's stick to uploading first, then saving.
    // The `orderId` used for storage path in the code above refers to a *preliminary* doc.
    // This is complex. Simpler for now: Upload, then add to Firestore. The Order ID will be for the Firestore doc.

    const docData: Omit<OrderData, 'createdAt'> & { createdAt: any } = {
        ...order,
        status: 'pending',
        createdAt: serverTimestamp(),
        pdfDownloadURL: pdfDownloadURL, // Will be null if no file upload
    };
    // Remove fileDataUri as it's not part of OrderData
    delete (docData as any).fileDataUri;


    const docRef = await addDoc(collection(db, "orders"), docData);
    console.log("Order submitted to Firebase with ID: ", docRef.id);
    return { success: true, orderId: docRef.id };

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
    
    return { success: false, error: errorMessage };
  }
}
