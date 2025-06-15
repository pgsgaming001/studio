
'use server';

import Razorpay from 'razorpay';
import { z } from 'zod';
import { randomBytes } from 'crypto';

// IMPORTANT: Move these keys to environment variables in a real application!
// For local development, create a .env.local file in your project root:
// NEXT_PUBLIC_RAZORPAY_KEY_ID=your_test_key_id
// RAZORPAY_KEY_SECRET=your_test_key_secret
// For Railway/Vercel etc., set them in the environment variable settings.

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_LIO1YzPDGmjbWi';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'xOQgKI0eJyDjjSgtkiYojc1H';

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  const message = "Razorpay API Key ID or Key Secret is not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.";
  console.error(message);
  // In a real app, you might not want to expose the existence of keys this way in an error
  // but for local dev/prototyping, it's helpful.
}


const instance = new Razorpay({
  key_id: RAZORPAY_KEY_ID!, 
  key_secret: RAZORPAY_KEY_SECRET!,
});

// Razorpay typically expects amount in smallest currency unit (e.g., paise for INR).
// Minimum amount for INR is usually 100 paise (₹1.00).
const CreateOrderInputSchema = z.object({
  amount: z.number().positive("Amount must be a positive number.").min(1, "Minimum order amount is ₹1.00."), // Amount in base currency unit (e.g., INR)
  currency: z.string().min(3).max(3).default("INR"), // Default to INR
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export interface CreateOrderOutput {
  success: boolean;
  orderId?: string;
  error?: string;
  amount?: number; // Amount in paise
  currency?: string;
  razorpayKeyId?: string;
  issues?: z.ZodIssue[];
}

export async function createRazorpayOrder(
  input: CreateOrderInput
): Promise<CreateOrderOutput> {
  console.log("createRazorpayOrder: Received input:", input);
  const validationResult = CreateOrderInputSchema.safeParse(input);
  if (!validationResult.success) {
    console.error("createRazorpayOrder: Invalid input for creating order.", validationResult.error.issues);
    return { success: false, error: "Invalid input for creating order.", issues: validationResult.error.issues };
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("createRazorpayOrder: Razorpay API keys are not configured on the server.");
      return { success: false, error: "Razorpay API keys are not configured on the server." };
  }

  const { amount, currency } = validationResult.data;
  const amountInPaise = Math.round(amount * 100);

  if (amountInPaise < 100) { // Razorpay minimum is usually 100 paise (₹1.00)
    const errorMsg = `Order amount ₹${amount.toFixed(2)} (i.e., ${amountInPaise} paise) is less than Razorpay's minimum of 100 paise (₹1.00).`;
    console.error("createRazorpayOrder: Amount too low - ", errorMsg);
    return { success: false, error: errorMsg };
  }

  const options = {
    amount: amountInPaise,
    currency,
    receipt: `rcpt_${randomBytes(4).toString('hex')}_${Date.now()}`, // Unique receipt ID
  };

  try {
    console.log("createRazorpayOrder: Attempting to create Razorpay order with options:", options);
    const order = await instance.orders.create(options);
    console.log("createRazorpayOrder: Razorpay order created successfully:", order);
    return {
      success: true,
      orderId: order.id,
      amount: order.amount, 
      currency: order.currency,
      razorpayKeyId: RAZORPAY_KEY_ID
    };
  } catch (error: any) {
    console.error("createRazorpayOrder: Error creating Razorpay order:", error);
    let errorMessage = "Failed to create Razorpay order.";
    if (error.error && error.error.description) { // Razorpay often has a nested error object
        errorMessage = error.error.description;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
