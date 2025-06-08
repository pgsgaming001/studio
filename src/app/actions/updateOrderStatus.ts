
'use server';

import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import type { OrderDataMongo } from './submitOrder'; // Re-use the interface
import type { OrderDisplayData } from './getOrders';   // Re-use for return type

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const VALID_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

interface UpdateOrderStatusPayload {
  orderId: string;
  newStatus: OrderStatus;
}

export async function updateOrderStatus(
  payload: UpdateOrderStatusPayload
): Promise<{ success: boolean; updatedOrder?: OrderDisplayData; error?: string }> {
  const { orderId, newStatus } = payload;

  if (!ObjectId.isValid(orderId)) {
    return { success: false, error: 'Invalid Order ID format.' };
  }

  if (!VALID_STATUSES.includes(newStatus)) {
    return { success: false, error: `Invalid status value: ${newStatus}.` };
  }

  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<OrderDataMongo>('orders');

    const result = await ordersCollection.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { status: newStatus } },
      { returnDocument: 'after' } // Return the updated document
    );

    if (!result) {
      return { success: false, error: 'Order not found or status not updated.' };
    }
    
    const updatedDoc = result as OrderDataMongo; // result is the updated doc

    // Map MongoDB document to client-friendly format
    const displayOrder: OrderDisplayData = {
      ...updatedDoc,
      id: updatedDoc._id!.toString(),
      createdAt: updatedDoc.createdAt.toISOString(),
    };
    
    return { success: true, updatedOrder: displayOrder };

  } catch (error: any) {
    console.error('Error updating order status in MongoDB:', error);
    return {
      success: false,
      error: `Failed to update order status: ${error.message || 'Unknown database error'}`,
    };
  }
}
