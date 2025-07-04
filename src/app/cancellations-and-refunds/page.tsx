
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw } from "lucide-react";

export default function CancellationsAndRefundsPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center space-x-3">
            <RefreshCcw className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-3xl text-primary">Cancellations and Refunds</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 text-muted-foreground prose prose-sm max-w-none">
          <p className="text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Order Cancellations</h2>
            <ul className="list-disc pl-5 space-y-1">
                <li><strong>E-commerce Products:</strong> You may cancel an order for a physical product at any time before it has been shipped. To cancel, please contact our support team immediately with your order number. If the order has already been shipped, it will be treated as a return.</li>
                <li><strong>Print Service Orders:</strong> Due to the custom nature of our print services, orders cannot be cancelled once they have entered the production phase. If you need to cancel, please contact us as soon as possible after placing the order, and we will do our best to accommodate if production has not yet started.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Returns and Refunds</h2>
             <ul className="list-disc pl-5 space-y-1">
                <li><strong>E-commerce Products:</strong> We offer a 14-day return policy for physical products. If you are not satisfied with your purchase, you can return it within 14 days of receipt for a full refund, provided the item is in its original, unused, and unopened condition with all original packaging. The customer is responsible for return shipping costs unless the item was damaged or incorrect upon arrival.</li>
                <li><strong>Print Service Orders:</strong> Custom print orders are non-refundable. However, if there is a clear printing error or defect on our part (e.g., wrong paper size, significant color inaccuracies, damage during our handling), we will gladly offer a reprint of the order at no additional cost.</li>
             </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. How to Initiate a Return or Report an Issue</h2>
            <p>To initiate a return for an e-commerce product or report an issue with a print order, please follow these steps:</p>
            <ol className="list-decimal pl-5 space-y-1">
                <li>Contact our customer support team at <a href="mailto:support@xerox2u.com" className="text-primary hover:underline">support@xerox2u.com</a> within the specified timeframe.</li>
                <li>Provide your order number and a clear description of the issue.</li>
                <li>For defective or incorrect print orders, please include photographic evidence of the problem.</li>
                <li>Our team will review your request and provide you with further instructions.</li>
            </ol>
            <p>Refunds for returned e-commerce products will be processed within 5-7 business days after we receive and inspect the item.</p>
          </section>

           <section>
            <h2 className="text-xl font-semibold text-foreground">4. Contact Us</h2>
            <p>If you have any questions about our Cancellations and Refunds Policy, please contact us at <a href="mailto:support@xerox2u.com" className="text-primary hover:underline">support@xerox2u.com</a>.</p>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
