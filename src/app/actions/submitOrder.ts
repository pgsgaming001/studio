
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import type { Address } from '@/components/features/xerox/DeliveryAddress';

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
  createdAt: Timestamp | any; // For serverTimestamp()
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
    return { success: false, error: "Incomplete delivery address." };
  }


  try {
    const orderToSave: Omit<OrderData, 'createdAt'> & { createdAt: any } = {
      ...order,
      status: 'pending',
      createdAt: serverTimestamp() // Firestore will convert this to a Timestamp
    };

    const docRef = await addDoc(collection(db, "orders"), orderToSave);
    console.log("Order submitted to Firebase with ID: ", docRef.id);
    return { success: true, orderId: docRef.id };
  } catch (e) {
    console.error("Error adding document to Firebase: ", e);
    // Try to provide a more specific error message if possible
    let errorMessage = "Failed to submit order to Firebase.";
    if (e instanceof Error) {
      errorMessage += ` Details: ${e.message}`;
    }
    return { success: false, error: errorMessage };
  }
}
