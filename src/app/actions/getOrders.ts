
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { OrderDataMongo } from './submitOrder'; // Re-use the interface

// Define the structure of the data returned to the client, converting ObjectId to string
export interface OrderDisplayData extends Omit<OrderDataMongo, '_id' | 'createdAt'> {
  id: string;
  createdAt: string; // Dates will be stringified for client transfer
}

export async function getOrdersFromMongoDB(): Promise<{ orders: OrderDisplayData[], error?: string }> {
  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDataMongo>('orders');
    
    const fetchedOrders = await ordersCollection.find({})
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .toArray();

    // Map MongoDB documents to client-friendly format
    const displayOrders: OrderDisplayData[] = fetchedOrders.map(order => ({
      ...order,
      id: order._id!.toString(), // Convert ObjectId to string
      createdAt: order.createdAt.toISOString(), // Convert Date to ISO string
    }));
    
    return { orders: displayOrders };
  } catch (error: any) {
    console.error("Error fetching orders from MongoDB:", error);
    return { 
      orders: [], 
      error: `Failed to fetch orders: ${error.message || 'Unknown database error'}` 
    };
  }
}
