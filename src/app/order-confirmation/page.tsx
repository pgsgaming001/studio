
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle, Home } from "lucide-react";
import Link from "next/link";

export default function OrderConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-lg shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-primary/5 p-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 ring-4 ring-green-200">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="font-headline text-3xl md:text-4xl text-primary">Order Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 p-8">
          <p className="text-muted-foreground text-base">
            Thank you for your order with <span className="font-semibold text-primary">My First Project</span>. Your documents are now in our queue to be printed and prepared for delivery.
          </p>
          <p className="text-muted-foreground text-sm">
            A confirmation email with your order details has been sent to your registered email address (this is a placeholder notification).
          </p>
        </CardContent>
        <CardFooter className="bg-secondary/50 p-6">
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg">
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Back to Homepage
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
