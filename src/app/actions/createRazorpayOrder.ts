
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
  key_id: RAZORPAY_KEY_ID!, // The "!" asserts that these are defined, guarded by the check above for real env vars.
  key_secret: RAZORPAY_KEY_SECRET!,
});

const CreateOrderInputSchema = z.object({
  amount: z.number().positive("Amount must be a positive number."), // Amount in smallest currency unit (e.g., paise for INR)
  currency: z.string().min(3).max(3).default("INR"), // Default to INR
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export async function createRazorpayOrder(
  input: CreateOrderInput
): Promise<{ success: boolean; orderId?: string; error?: string; amount?: number; currency?: string; razorpayKeyId?: string }> {
  const validationResult = CreateOrderInputSchema.safeParse(input);
  if (!validationResult.success) {
    return { success: false, error: "Invalid input for creating order.", issues: validationResult.error.issues };
  }

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return { success: false, error: "Razorpay API keys are not configured on the server." };
  }

  const { amount, currency } = validationResult.data;

  const options = {
    amount: Math.round(amount * 100), // Razorpay expects amount in paise (for INR)
    currency,
    receipt: `rcpt_${randomBytes(4).toString('hex')}_${Date.now()}`, // Unique receipt ID
  };

  try {
    console.log("Attempting to create Razorpay order with options:", options);
    const order = await instance.orders.create(options);
    console.log("Razorpay order created successfully:", order);
    return {
      success: true,
      orderId: order.id,
      amount: order.amount, // Amount in paise from Razorpay
      currency: order.currency,
      razorpayKeyId: RAZORPAY_KEY_ID
    };
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return { success: false, error: error.message || "Failed to create Razorpay order." };
  }
}
