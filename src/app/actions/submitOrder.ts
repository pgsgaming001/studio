
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
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
}

// This is the type for data coming from the form
export type OrderFormPayload = Omit<OrderData, 'status' | 'createdAt'>;


export async function submitOrderToFirebase(order: OrderFormPayload): Promise<{success: boolean, orderId?: string, error?: string}> {
  if (!db) {
    console.error("Firebase Firestore client is not initialized. Check src/lib/firebase.ts configuration.");
    return { success: false, error: "Firebase service is not configured properly." };
  }
  
  // Ensure all required fields for the address are present
  if (!order.deliveryAddress || !order.deliveryAddress.street || !order.deliveryAddress.city || !order.deliveryAddress.state || !order.deliveryAddress.zip || !order.deliveryAddress.country) {
    return { success: false, error: "Incomplete delivery address. All address fields are required." };
  }


  try {
    const orderToSave: Omit<OrderData, 'createdAt'> & { createdAt: any } = {
      ...order,
      status: 'pending', // Default status for new orders
      createdAt: serverTimestamp() // Firestore will convert this to a Timestamp
    };

    const docRef = await addDoc(collection(db, "orders"), orderToSave);
    console.log("Order submitted to Firebase with ID: ", docRef.id);
    return { success: true, orderId: docRef.id };
  } catch (e: any) { // Catch as any to inspect its properties
    console.error("Error adding document to Firebase: ", e);
    
    let errorMessage = "Failed to submit order to Firebase.";
    
    if (e && typeof e.message === 'string') {
      errorMessage += ` Details: ${e.message}`;
    } else if (typeof e === 'string') {
      // If the error itself is a string
      errorMessage += ` Details: ${e}`;
    }

    // Firebase errors often have a 'code' property
    if (e && typeof e.code === 'string') {
        errorMessage += ` (Code: ${e.code})`;
    }
    
    return { success: false, error: errorMessage };
  }
}

