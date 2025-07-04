
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function ShippingPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center space-x-3">
            <Truck className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-3xl text-primary">Shipping Policy</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 text-muted-foreground prose prose-sm max-w-none">
          <p className="text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Order Processing Time</h2>
            <p>We are committed to getting your order to you as quickly as possible.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>E-commerce Products:</strong> All orders for in-stock products are processed within 1-2 business days (excluding weekends and holidays) after receiving your order confirmation email.</li>
              <li><strong>Print Service Orders:</strong> Custom print orders have a production time of 1-2 business days before they are ready for dispatch or pickup.</li>
            </ul>
             <p>You will receive another notification when your order has shipped or is ready for pickup.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Shipping Rates and Delivery Estimates</h2>
             <p>Shipping charges for your order will be calculated and displayed at checkout.</p>
             <ul className="list-disc pl-5 space-y-1">
                <li><strong>Local Pickup:</strong> Orders for our Print Service can be picked up for free from our designated locations. Please select the "Pickup" option at checkout.</li>
                <li><strong>Home Delivery:</strong> We offer home delivery for a flat fee, which will be specified during the checkout process. Delivery typically takes an additional 2-5 business days after the processing/production time.</li>
             </ul>
             <p>Please note that delivery times are estimates and may vary due to factors beyond our control, such as shipping carrier delays or high order volumes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Order Tracking</h2>
            <p>When your order has shipped, you will receive an email notification from us which will include a tracking number you can use to check its status. Please allow 48 hours for the tracking information to become available.</p>
            <p>If you haven’t received your order within 7 days of receiving your shipping confirmation email, please contact us at <a href="mailto:support@xerox2u.com" className="text-primary hover:underline">support@xerox2u.com</a> with your name and order number, and we will look into it for you.</p>
          </section>

           <section>
            <h2 className="text-xl font-semibold text-foreground">4. Contact Us</h2>
            <p>If you have any further questions, please don't hesitate to contact us at <a href="mailto:support@xerox2u.com" className="text-primary hover:underline">support@xerox2u.com</a>.</p>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
