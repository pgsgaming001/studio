
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Truck, CreditCard, PackageIcon } from "lucide-react"; // Added PackageIcon

interface OrderSummaryProps {
  printCost: number;
  deliveryFee: number; // Can be 0 for pickup
}

export function OrderSummary({ printCost, deliveryFee }: OrderSummaryProps) {
  const totalCost = printCost + deliveryFee;
  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground flex items-center">
          <ShoppingCart size={16} className="mr-2 text-primary"/>Print Cost
        </span>
        <span className="font-medium">₹{printCost.toFixed(2)}</span>
      </div>
      {deliveryFee > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center">
            <Truck size={16} className="mr-2 text-primary"/>Delivery Fee
          </span>
          <span className="font-medium">₹{deliveryFee.toFixed(2)}</span>
        </div>
      )}
       {deliveryFee === 0 && (
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center">
            <PackageIcon size={16} className="mr-2 text-primary"/>Pickup
          </span>
          <span className="font-medium text-green-600">Free</span>
        </div>
      )}
      <Separator className="my-2" />
      <div className="flex justify-between items-center font-semibold text-base">
        <span className="flex items-center">
            <CreditCard size={18} className="mr-2 text-primary" /> Total Amount
        </span>
        <span>₹{totalCost.toFixed(2)}</span>
      </div>
    </div>
  );
}
    
