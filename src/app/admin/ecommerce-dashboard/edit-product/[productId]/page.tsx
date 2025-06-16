
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductById, type ProductDisplayData } from "@/app/actions/getProductById";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EditProductPage() {
  const params = useParams();
  const productId = params.productId as string;

  const [product, setProduct] = useState<ProductDisplayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      setIsLoading(true);
      setError(null);
      getProductById(productId)
        .then(result => {
          if (result.error) {
            setError(result.error);
            setProduct(null);
          } else if (result.product) {
            setProduct(result.product);
          } else {
            setError("Product not found.");
            setProduct(null);
          }
        })
        .catch(err => {
          console.error("Error fetching product for edit:", err);
          setError(err.message || "An unexpected error occurred while fetching product data.");
          setProduct(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setError("No product ID provided.");
      setIsLoading(false);
    }
  }, [productId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Product</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button asChild variant="outline">
          <Link href="/admin/ecommerce-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product List
          </Link>
        </Button>
      </div>
    );
  }

  if (!product) {
     // This case should ideally be covered by error state, but as a fallback
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-muted-foreground mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-6">The product you are trying to edit could not be found.</p>
        <Button asChild variant="outline">
          <Link href="/admin/ecommerce-dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product List
          </Link>
        </Button>
      </div>
    );
  }

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
      <ProductForm mode="edit" productToEdit={product} />
    </div>
  );
}
