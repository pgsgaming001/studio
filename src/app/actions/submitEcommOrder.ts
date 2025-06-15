
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

const RazorpayPaymentDetailsSchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_order_id: z.string(),
  razorpay_signature: z.string(),
}).optional();

const EcommOrderPayloadSchema = z.object({
  customerInfo: EcommCustomerInfoSchema,
  orderedProducts: z.array(EcommOrderedProductSchema).min(1, "Order must contain at least one product."),
  totalAmount: z.number().positive("Total amount must be positive."),
  paymentMethod: z.enum(["cod", "razorpay"]), // Updated payment methods
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  userName: z.string().optional(),
  paymentDetails: RazorpayPaymentDetailsSchema, // Added paymentDetails
});

export type EcommOrderPayload = z.infer<typeof EcommOrderPayloadSchema>;

// Interface for MongoDB document
export interface EcommOrderMongo {
  _id: ObjectId;
  customerInfo: EcommCustomerInfoSchema.infer<typeof EcommCustomerInfoSchema>;
  orderedProducts: EcommOrderedProductSchema.infer<typeof EcommOrderedProductSchema>[];
  totalAmount: number;
  paymentMethod: "cod" | "razorpay"; // Updated payment methods
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'paid'; // Added 'paid' status
  createdAt: Date;
  updatedAt: Date;
  userId?: string; 
  userEmail?: string; 
  userName?: string; 
  paymentDetails?: { // Added paymentDetails
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };
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
    status: validatedData.paymentMethod === 'razorpay' && validatedData.paymentDetails ? 'paid' : 'pending', // Set status to 'paid' if Razorpay details exist
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: validatedData.userId,
    userEmail: validatedData.userEmail,
    userName: validatedData.userName,
    paymentDetails: validatedData.paymentDetails, // Store payment details
  };


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
