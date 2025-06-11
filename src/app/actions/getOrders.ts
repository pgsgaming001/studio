
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { OrderDataMongo } from './submitOrder'; 
import type { ObjectId } from 'mongodb';

// Define the structure of the data returned to the client, converting ObjectId to string
export interface OrderDisplayData extends Omit<OrderDataMongo, '_id' | 'createdAt' | 'pdfDownloadURL' | 'fileName' | 'deliveryAddress' | 'numCopies' | 'numPages' | 'paperSize' | 'printColor' | 'printSides' | 'layout' | 'totalCost' | 'status'> {
  id: string;
  createdAt: string; 
  fileName: string | null;
  numPages: string;
  numCopies: string;
  printColor: 'color' | 'bw';
  paperSize: 'A4' | 'Letter' | 'Legal';
  printSides: 'single' | 'double';
  layout: '1up' | '2up';
  deliveryAddress: { 
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  totalCost: number;
  status: string; 
  pdfDownloadURL?: string | null;
  userId?: string;
  userEmail?: string;
  userName?: string;
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
      const { _id, createdAt, deliveryAddress, ...restOfOrder } = order; 
      return {
        ...restOfOrder, 
        id: _id!.toString(), 
        createdAt: createdAt.toISOString(), 
        deliveryAddress: { 
          street: deliveryAddress.street,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zip: deliveryAddress.zip,
          country: deliveryAddress.country,
        },
        userId: order.userId,
        userEmail: order.userEmail,
        userName: order.userName,
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
