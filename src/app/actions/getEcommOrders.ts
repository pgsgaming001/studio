
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { EcommOrderMongo } from './submitEcommOrder'; // Re-use the interface from submission
import type { ObjectId } from 'mongodb';

export type EcommOrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// Define the structure of the data returned to the client for e-commerce orders
export interface EcommOrderDisplayData {
  id: string;
  customerName: string;
  customerEmail: string;
  orderedProductsSummary: string; // e.g., "Product A, Product B (+2 more)"
  totalAmount: number;
  status: EcommOrderStatus;
  paymentMethod: string;
  createdAt: string; // Dates will be stringified for client transfer
  // Add any other fields needed for display
}


export async function getEcommOrdersFromMongoDB(
  // Future: Add pagination, filtering options if needed
): Promise<{ orders: EcommOrderDisplayData[], error?: string }> {
  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<EcommOrderMongo>('ecommerce_orders');
    
    const fetchedOrders = await ordersCollection.find({})
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .limit(50) // Limit to 50 recent orders for now
      .toArray();

    // Map MongoDB documents to client-friendly format
    const displayOrders: EcommOrderDisplayData[] = fetchedOrders.map(order => {
      const { _id, createdAt, customerInfo, orderedProducts, ...restOfOrder } = order;
      
      let productsSummary = "N/A";
      if (orderedProducts && orderedProducts.length > 0) {
        const firstProduct = orderedProducts[0].name;
        if (orderedProducts.length === 1) {
          productsSummary = firstProduct;
        } else {
          productsSummary = `${firstProduct} (+${orderedProducts.length - 1} more)`;
        }
      }
      
      return {
        ...restOfOrder,
        id: _id!.toString(),
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        orderedProductsSummary: productsSummary,
        status: order.status as EcommOrderStatus, // Ensure status is correctly typed
        createdAt: createdAt.toISOString(),
      };
    });
    
    return { orders: displayOrders };
  } catch (error: any) {
    console.error("Error fetching e-commerce orders from MongoDB:", error);
    return { 
      orders: [], 
      error: `Failed to fetch e-commerce orders: ${error.message || 'Unknown database error'}` 
    };
  }
}
