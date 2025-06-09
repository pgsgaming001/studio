
import { ProductForm } from "@/components/admin/ProductForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AddProductPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
       <div className="mb-6">
        <Button asChild variant="outline" size="sm" className="text-muted-foreground hover:text-primary">
          <Link href="/admin/ecommerce-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product List
          </Link>
        </Button>
      </div>
      <ProductForm mode="add" />
    </div>
  );
}
