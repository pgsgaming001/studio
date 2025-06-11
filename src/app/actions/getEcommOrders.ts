
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { EcommOrderMongo } from './submitEcommOrder'; 
import type { ObjectId } from 'mongodb';

export type EcommOrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface EcommOrderDisplayData {
  id: string;
  customerName: string; // This will be populated from order.userName or order.customerInfo.name
  customerEmail: string; // This will be populated from order.userEmail or order.customerInfo.email
  orderedProductsSummary: string; 
  totalAmount: number;
  status: EcommOrderStatus;
  paymentMethod: string;
  createdAt: string; 
  userId?: string; // Added for potential admin filtering or display
}


export async function getEcommOrdersFromMongoDB(
  { userIdFilter }: { userIdFilter?: string } = {}
): Promise<{ orders: EcommOrderDisplayData[], error?: string }> {
  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<EcommOrderMongo>('ecommerce_orders');
    
    const query: any = {};
    if (userIdFilter) {
      query.userId = userIdFilter;
    }

    const fetchedOrders = await ordersCollection.find(query)
      .sort({ createdAt: -1 }) 
      .limit(userIdFilter ? 0 : 50) // No limit if filtering for a user, otherwise limit for general admin view
      .toArray();

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
        // Prioritize user fields if they exist (from logged-in user at time of order)
        customerName: order.userName || customerInfo.name,
        customerEmail: order.userEmail || customerInfo.email,
        orderedProductsSummary: productsSummary,
        status: order.status as EcommOrderStatus, 
        createdAt: createdAt.toISOString(),
        userId: order.userId,
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
