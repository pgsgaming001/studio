
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-3xl text-primary">Privacy Policy</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 text-muted-foreground prose prose-sm max-w-none">
          <p className="text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p>Xerox2U ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Collection of Your Information</h2>
            <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, that you voluntarily give to us when you register with the Site or when you choose to participate in various activities related to the Site, such as online chat and message boards.</li>
              <li><strong>Authentication Data:</strong> We use Google Authentication. We may collect your name, email, and profile picture from your Google account as part of the sign-in process.</li>
              <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
              <li><strong>Financial Data:</strong> Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, or exchange. We store only very limited, if any, financial information that we collect. Otherwise, all financial information is stored by our payment processor, Razorpay, and you are encouraged to review their privacy policy.</li>
              <li><strong>Uploaded Files:</strong> For our print service, we temporarily store the files (PDFs, images) you upload to fulfill your order.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Use of Your Information</h2>
            <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Create and manage your account.</li>
                <li>Fulfill and manage purchases, orders, payments, and other transactions related to the Site.</li>
                <li>Process your print service orders.</li>
                <li>Email you regarding your account or order.</li>
                <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
                <li>Request feedback and contact you about your use of the Site.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Security of Your Information</h2>
            <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
            <p>Uploaded files for print orders are stored securely on Firebase Storage and are accessed only for the purpose of fulfilling your order. We have rules in place to restrict unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Policy for Children</h2>
            <p>We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Contact Us</h2>
            <p>If you have any questions or comments about this Privacy Policy, please contact us at: <a href="mailto:privacy@xerox2u.com" className="text-primary hover:underline">privacy@xerox2u.com</a>.</p>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
