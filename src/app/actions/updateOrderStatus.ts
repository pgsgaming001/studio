'use server';

import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import type { OrderDataMongo } from './submitOrder'; // Re-use the interface
import type { OrderDisplayData } from './getOrders';   // Re-use for return type

export type OrderStatus = 'pending' | 'processing' | 'awaiting_pickup' | 'shipped' | 'delivered' | 'cancelled';

const VALID_STATUSES: OrderStatus[] = ['pending', 'processing', 'awaiting_pickup', 'shipped', 'delivered', 'cancelled'];

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
    
    const updatedDoc = result as OrderDataMongo; 

    // Map MongoDB document to client-friendly format
    const { _id, createdAt, deliveryAddress, ...restOfUpdatedDoc } = updatedDoc;
    const displayOrder: OrderDisplayData = {
      ...restOfUpdatedDoc,
      id: _id!.toString(),
      createdAt: createdAt.toISOString(),
       deliveryAddress: { // Ensure deliveryAddress is correctly structured
          street: deliveryAddress.street,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zip: deliveryAddress.zip,
          country: deliveryAddress.country,
        },
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
