
'use server';

import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Schemas for validation
const EcommAddressSchema = z.object({
  street: z.string().min(1, "Street is required."),
  city: z.string().min(1, "City is required."),
  postalCode: z.string().min(1, "Postal code is required."),
  country: z.string().min(1, "Country is required."),
});

const EcommCustomerInfoSchema = z.object({
  name: z.string().min(1, "Customer name is required."),
  phone: z.string().min(1, "Customer phone is required."),
  email: z.string().email("Invalid email format."),
  address: EcommAddressSchema,
});

const EcommOrderedProductSchema = z.object({
  productId: z.string(), 
  name: z.string(),
  price: z.number(),
  quantity: z.number().int().min(1),
  image: z.string().url().optional().or(z.literal("")),
});

const EcommOrderPayloadSchema = z.object({
  customerInfo: EcommCustomerInfoSchema,
  orderedProducts: z.array(EcommOrderedProductSchema).min(1, "Order must contain at least one product."),
  totalAmount: z.number().positive("Total amount must be positive."),
  paymentMethod: z.enum(["cod", "card_placeholder"]),
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  userName: z.string().optional(),
});

export type EcommOrderPayload = z.infer<typeof EcommOrderPayloadSchema>;

// Interface for MongoDB document
export interface EcommOrderMongo {
  _id: ObjectId;
  customerInfo: EcommCustomerInfoSchema.infer<typeof EcommCustomerInfoSchema>;
  orderedProducts: EcommOrderedProductSchema.infer<typeof EcommOrderedProductSchema>[];
  totalAmount: number;
  paymentMethod: "cod" | "card_placeholder";
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // Added for user tracking
  userEmail?: string; // Added for user tracking (can override customerInfo.email if user is logged in)
  userName?: string; // Added for user tracking (can override customerInfo.name if user is logged in)
}

export async function submitEcommOrder(
  payload: EcommOrderPayload
): Promise<{ success: boolean; orderId?: string; error?: string; issues?: z.ZodIssue[] }> {
  console.log("submitEcommOrder server action invoked with payload:", payload);

  const validationResult = EcommOrderPayloadSchema.safeParse(payload);
  if (!validationResult.success) {
    console.error("E-commerce order validation failed:", validationResult.error.issues);
    return { success: false, error: "Validation failed.", issues: validationResult.error.issues };
  }

  const validatedData = validationResult.data;
  const newOrderId = new ObjectId();

  const orderToInsert: Omit<EcommOrderMongo, '_id'> = {
    customerInfo: validatedData.customerInfo,
    orderedProducts: validatedData.orderedProducts,
    totalAmount: validatedData.totalAmount,
    paymentMethod: validatedData.paymentMethod,
    status: 'pending', // Initial status
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: validatedData.userId,
    userEmail: validatedData.userEmail, // This will store the authenticated user's email
    userName: validatedData.userName,   // This will store the authenticated user's name
  };

  // If logged-in user provided details, they might override the form's customerInfo for name/email
  // but the full address still comes from customerInfo.address
  // The server action now directly stores userId, userEmail, userName from payload.

  console.log("E-commerce order document to be inserted into MongoDB:", JSON.stringify({ _id: newOrderId, ...orderToInsert }, null, 2));

  try {
    const { db } = await connectToDatabase();
    const ordersCollection = db.collection<EcommOrderMongo>('ecommerce_orders');
    
    console.log("Attempting to insert e-commerce order into MongoDB...");
    const result = await ordersCollection.insertOne({ _id: newOrderId, ...orderToInsert });

    if (!result.insertedId) {
      console.error("MongoDB insert operation failed to return an insertedId for e-commerce order.");
      throw new Error("MongoDB insert operation failed.");
    }
    
    const insertedIdString = result.insertedId.toString();
    console.log("E-commerce order added successfully to MongoDB with ID:", insertedIdString);
    return { success: true, orderId: insertedIdString };

  } catch (e: any) {
    console.error("Error adding e-commerce order to MongoDB:", e);
    return { success: false, error: `Database operation failed: ${e.message}` };
  }
}
