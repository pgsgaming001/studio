
'use server';

import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';
import type { EcommOrderMongo } from './submitEcommOrder'; 
import type { EcommOrderDisplayData, EcommOrderStatus } from './getEcommOrders';   

const VALID_ECOMM_STATUSES: EcommOrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

interface UpdateEcommOrderStatusPayload {
  orderId: string;
  newStatus: EcommOrderStatus;
}

export async function updateEcommOrderStatus(
  payload: UpdateEcommOrderStatusPayload
): Promise<{ success: boolean; updatedOrder?: EcommOrderDisplayData; error?: string }> {
  const { orderId, newStatus } = payload;

  if (!ObjectId.isValid(orderId)) {
    return { success: false, error: 'Invalid E-commerce Order ID format.' };
  }

  if (!VALID_ECOMM_STATUSES.includes(newStatus)) {
    return { success: false, error: `Invalid e-commerce status value: ${newStatus}.` };
  }

  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<EcommOrderMongo>('ecommerce_orders');

    const result = await ordersCollection.findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { status: newStatus, updatedAt: new Date() } }, // Also update 'updatedAt' timestamp
      { returnDocument: 'after' } 
    );

    if (!result) {
      return { success: false, error: 'E-commerce order not found or status not updated.' };
    }
    
    const updatedDoc = result as EcommOrderMongo; 

    // Map MongoDB document to client-friendly format
    const { _id, createdAt, customerInfo, orderedProducts, ...restOfUpdatedDoc } = updatedDoc;
    let productsSummary = "N/A";
    if (orderedProducts && orderedProducts.length > 0) {
        const firstProduct = orderedProducts[0].name;
        if (orderedProducts.length === 1) {
          productsSummary = firstProduct;
        } else {
          productsSummary = `${firstProduct} (+${orderedProducts.length - 1} more)`;
        }
    }

    const displayOrder: EcommOrderDisplayData = {
      ...restOfUpdatedDoc,
      id: _id!.toString(),
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      orderedProductsSummary: productsSummary,
      status: updatedDoc.status as EcommOrderStatus,
      createdAt: createdAt.toISOString(),
    };
    
    return { success: true, updatedOrder: displayOrder };

  } catch (error: any) {
    console.error('Error updating e-commerce order status in MongoDB:', error);
    return {
      success: false,
      error: `Failed to update e-commerce order status: ${error.message || 'Unknown database error'}`,
    };
  }
}
