
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { OrderDataMongo } from './submitOrder'; // Re-use the interface
import type { ObjectId } from 'mongodb';

// Define the structure of the data returned to the client, converting ObjectId to string
export interface OrderDisplayData extends Omit<OrderDataMongo, '_id' | 'createdAt' | 'pdfDownloadURL' | 'fileName' | 'deliveryAddress' | 'numCopies' | 'numPages' | 'paperSize' | 'printColor' | 'printSides' | 'layout' | 'totalCost' | 'status'> {
  id: string;
  createdAt: string; // Dates will be stringified for client transfer
  fileName: string | null;
  numPages: string;
  numCopies: string;
  printColor: 'color' | 'bw';
  paperSize: 'A4' | 'Letter' | 'Legal';
  printSides: 'single' | 'double';
  layout: '1up' | '2up';
  deliveryAddress: { // Ensure Address type is explicitly part of OrderDisplayData if not fully covered by Omit/Pick
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  totalCost: number;
  status: string; // Keeping status as string, client can cast to OrderStatus if needed
  pdfDownloadURL?: string | null;
}


export async function getOrdersFromMongoDB(): Promise<{ orders: OrderDisplayData[], error?: string }> {
  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDataMongo>('orders');
    
    const fetchedOrders = await ordersCollection.find({})
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .toArray();

    // Map MongoDB documents to client-friendly format
    const displayOrders: OrderDisplayData[] = fetchedOrders.map(order => {
      const { _id, createdAt, deliveryAddress, ...restOfOrder } = order; // Destructure _id and createdAt
      return {
        ...restOfOrder, // Spread the rest of the properties
        id: _id!.toString(), // Convert ObjectId to string and assign to id
        createdAt: createdAt.toISOString(), // Convert Date to ISO string
        deliveryAddress: { // Ensure deliveryAddress is correctly structured
          street: deliveryAddress.street,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zip: deliveryAddress.zip,
          country: deliveryAddress.country,
        },
        // Ensure all other required fields from OrderDisplayData are present
        // This assumes 'restOfOrder' contains them or they are explicitly mapped
      };
    });
    
    return { orders: displayOrders };
  } catch (error: any) {
    console.error("Error fetching orders from MongoDB:", error);
    return { 
      orders: [], 
      error: `Failed to fetch orders: ${error.message || 'Unknown database error'}` 
    };
  }
}
