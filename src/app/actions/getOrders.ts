
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { OrderDataMongo } from './submitOrder'; 
import type { ObjectId } from 'mongodb';

// Define the structure of the data returned to the client, converting ObjectId to string
export interface OrderDisplayData extends Omit<OrderDataMongo, '_id' | 'createdAt' | 'fileDownloadURL' | 'deliveryAddress' | 'pickupCode'> {
  id: string;
  createdAt: string; 
  fileDownloadURL?: string | null;
  deliveryAddress: { 
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  pickupCode: string;
  // userId, userEmail, userName are already in OrderDataMongo and will be passed through
}


export async function getOrdersFromMongoDB(
  { userIdFilter }: { userIdFilter?: string } = {}
): Promise<{ orders: OrderDisplayData[], error?: string }> {
  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDataMongo>('orders');
    
    const query: any = {};
    if (userIdFilter) {
      query.userId = userIdFilter;
    }
    
    const fetchedOrders = await ordersCollection.find(query)
      .sort({ createdAt: -1 }) 
      .toArray();

    const displayOrders: OrderDisplayData[] = fetchedOrders.map(order => {
      const { _id, createdAt, deliveryAddress, fileDownloadURL, pickupCode, ...restOfOrder } = order; 
      return {
        ...restOfOrder, 
        id: _id!.toString(), 
        createdAt: createdAt.toISOString(), 
        fileDownloadURL: fileDownloadURL,
        pickupCode: pickupCode,
        deliveryAddress: { // Ensure deliveryAddress is correctly structured even if empty for pickup
          street: deliveryAddress?.street || '',
          city: deliveryAddress?.city || '',
          state: deliveryAddress?.state || '',
          zip: deliveryAddress?.zip || '',
          country: deliveryAddress?.country || '',
        },
        // userId, userEmail, userName, deliveryMethod, pickupCenter are in restOfOrder
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
    