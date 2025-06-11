
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Home, Mail, Landmark, ShoppingCart, Loader2 } from "lucide-react";
import { useState } from "react";

const checkoutFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "Phone number must be at least 10 digits.").regex(/^\+?[0-9\s-()]*$/, "Invalid phone number format."),
  email: z.string().email("Invalid email address."),
  street: z.string().min(5, "Street address is too short."),
  city: z.string().min(2, "City name is too short."),
  postalCode: z.string().min(3, "Postal code is too short."),
  country: z.string().min(2, "Country name is too short."),
  paymentMethod: z.enum(["cod", "card_placeholder"], {
    required_error: "Please select a payment method.",
  }),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

interface CheckoutFormProps {
  onSubmit: (data: CheckoutFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function CheckoutForm({ onSubmit, isSubmitting }: CheckoutFormProps) {
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      street: "",
      city: "",
      postalCode: "",
      country: "USA", // Default country
      paymentMethod: "cod",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <User className="mr-3 h-6 w-6" /> Shipping Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><User size={16} className="mr-2"/>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Mail size={16} className="mr-2"/>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Phone size={16} className="mr-2"/>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Home size={16} className="mr-2"/>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street, Apt 4B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Anytown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="90210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="United States" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl">
          <CardHeader className="bg-primary/5">
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <Landmark className="mr-3 h-6 w-6" /> Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                        <FormControl>
                          <RadioGroupItem value="cod" />
                        </FormControl>
                        <FormLabel className="font-normal text-base">
                          Cash on Delivery (COD)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-secondary/50 transition-colors opacity-50 cursor-not-allowed">
                        <FormControl>
                          <RadioGroupItem value="card_placeholder" disabled />
                        </FormControl>
                        <FormLabel className="font-normal text-base">
                          Credit/Debit Card (Coming Soon)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <p className="text-xs text-muted-foreground mt-4 text-center">
                Secure payment processing is under development. Only Cash on Delivery is currently available.
            </p>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-7 shadow-md" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          ) : (
            <ShoppingCart className="mr-2 h-6 w-6" />
          )}
          {isSubmitting ? "Processing Order..." : "Place Order"}
        </Button>
      </form>
    </Form>
  );
}

