

import { Button } from "@/components/ui/button";
import { Send, ShieldCheck, Loader2, CheckCircle, XCircle } from "lucide-react"; // Added Loader2, CheckCircle, XCircle
import { type SubmissionStatus } from "./XeroxForm"; // Import SubmissionStatus type

interface PaymentSectionProps {
  onPlaceOrder: () => void;
  disabled: boolean;
  submissionStatus: SubmissionStatus; // Added submissionStatus prop
}

export function PaymentSection({ onPlaceOrder, disabled, submissionStatus }: PaymentSectionProps) {

  const buttonText = () => {
    switch (submissionStatus) {
      case 'preparing':
        return 'Preparing Order...';
      case 'uploading':
        return 'Uploading File...';
      case 'processing':
        return 'Processing Order...';
      case 'success':
        return 'Order Placed!';
      case 'error':
        return 'Try Again';
      case 'idle':
      default:
        return 'Place Order';
    }
  };

  const isLoading = submissionStatus === 'preparing' || submissionStatus === 'uploading' || submissionStatus === 'processing';

  return (
    <div className="space-y-4">
      <Button 
        onClick={onPlaceOrder} 
        disabled={disabled || isLoading} // Disable button when loading
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-base py-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        aria-label="Place Order"
      >
        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
        {buttonText()}
      </Button>

      {submissionStatus === 'success' && (
        <p className="text-sm text-green-600 text-center flex items-center justify-center">
          <CheckCircle size={16} className="mr-1" /> Order successfully placed!
        </p>
      )}

      {submissionStatus === 'error' && (
        <p className="text-sm text-red-600 text-center flex items-center justify-center">
          <XCircle size={16} className="mr-1" /> Order submission failed.
        </p>
      )}

      {submissionStatus === 'idle' && (
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center">
          <ShieldCheck size={14} className="mr-1 text-green-500" /> Your order details are secure.
        </p>
      )}
      
       {submissionStatus === 'idle' && (
         <p className="text-xs text-muted-foreground text-center font-code">
           (PDF will be uploaded and order saved)
         </p>
       )}
    </div>
  );
}
    