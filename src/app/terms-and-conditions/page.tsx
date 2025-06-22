
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function TermsAndConditionsPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-3xl text-primary">Terms and Conditions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 text-muted-foreground prose prose-sm max-w-none">
          <p className="text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p>Welcome to Xerox2U ("we", "our", "us"). These Terms and Conditions govern your use of our website and the services offered, including document/photo printing and e-commerce sales. By accessing or using our service, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Services Provided</h2>
            <p>Xerox2U provides two main services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Print Service:</strong> Users can upload documents (PDFs) or photos for printing based on specified options (e.g., paper size, color, copies).</li>
              <li><strong>E-commerce Service:</strong> Users can browse and purchase products listed in our online store.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
            <p>To use our services, you must be logged in via Google Authentication. You are responsible for safeguarding your account and for any activities or actions under your account. You agree not to disclose your password to any third party and must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Orders, Payments, and Cancellations</h2>
            <p><strong>Pricing:</strong> All prices are listed in Indian Rupees (INR). We reserve the right to change prices for products and services at any time without prior notice.</p>
            <p><strong>Payment:</strong> We use Razorpay as our payment gateway for online payments. We also offer Cash on Delivery (COD) for certain orders. By providing payment information, you represent and warrant that you are authorized to use the designated payment method.</p>
            <p><strong>Order Acceptance:</strong> We reserve the right to refuse or cancel any order for any reason, including but not limited to: product or service availability, errors in the description or price of the product or service, or error in your order.</p>
            <p><strong>Cancellations & Refunds:</strong> Cancellation and refund policies may vary depending on the service. For print orders, cancellations are generally not possible once the printing process has begun. For e-commerce products, please refer to our return policy which will be provided on the product page or upon request. Refunds, if applicable, will be processed to the original method of payment.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. User-Uploaded Content</h2>
            <p>For the Print Service, you may upload files. You retain all rights to your content, but you grant us a license to use, reproduce, and modify it as necessary to fulfill your print order. You are solely responsible for the content you upload and warrant that you have all necessary rights to the content and that it does not infringe on any third-party rights or violate any laws (e.g., copyright, trademark).</p>
            <p>We are not responsible for the content of user-uploaded files and reserve the right to refuse to print any content that we deem illegal, offensive, or inappropriate.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Xerox2U shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</p>
          </section>

           <section>
            <h2 className="text-xl font-semibold text-foreground">8. Changes to Terms</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms and Conditions on this page. Your continued use of the service after any such changes constitutes your acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at: <a href="mailto:support@xerox2u.com" className="text-primary hover:underline">support@xerox2u.com</a>.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
