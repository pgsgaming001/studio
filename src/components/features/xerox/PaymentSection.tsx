
import { Button } from "@/components/ui/button";
import { Send, ShieldCheck } from "lucide-react"; // Changed CreditCard to Send

interface PaymentSectionProps {
  onPlaceOrder: () => void;
  disabled: boolean;
}

export function PaymentSection({ onPlaceOrder, disabled }: PaymentSectionProps) {
  return (
    <div className="space-y-4">
      <Button 
        onClick={onPlaceOrder} 
        disabled={disabled} 
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-base py-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        aria-label="Place Order"
      >
        <Send className="mr-2 h-5 w-5" /> Place Order
      </Button>
      <p className="text-xs text-muted-foreground text-center flex items-center justify-center">
        <ShieldCheck size={14} className="mr-1 text-green-500" /> Your order details are secure.
      </p>
      <p className="text-xs text-muted-foreground text-center font-code">
        (PDF will be uploaded and order saved)
      </p>
    </div>
  );
}
