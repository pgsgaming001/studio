
"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { getProducts, type ProductSummary } from "@/app/actions/getProducts";
import { ProductCard } from "@/components/features/ecommerce/ProductCard";
import { Loader2, AlertTriangle, ShoppingBag, Zap, ThumbsUp, Search as SearchIconLucide } from "lucide-react"; // Renamed Search to SearchIconLucide
import { Button } from "@/components/ui/button";
import Link from "next/link";

// These categories should ideally come from a shared source or config
// Duplicating from EcommercePlaceholder for now for simplicity
const placeholderCategories = [
  { name: "Electronics", icon: Zap, dataAiHint: "gadgets technology", slug: "electronics" },
  { name: "Home Goods", icon: ThumbsUp, dataAiHint: "home decor", slug: "home-goods" },
  { name: "Fashion", icon: ShoppingBag, dataAiHint: "apparel clothing", slug: "fashion" },
  { name: "Office", icon: SearchIconLucide, dataAiHint: "office supplies", slug: "office" }, // Using renamed SearchIconLucide
];

function CategoryResults() {
  const params = useParams();
  const categorySlug = params.categorySlug as string;

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCategoryName, setCurrentCategoryName] = useState<string | null>(null);

  useEffect(() => {
    if (categorySlug) {
      setIsLoading(true);
      setError(null);

      const categoryDetails = placeholderCategories.find(cat => cat.slug === categorySlug);
      
      if (!categoryDetails) {
        setError("Category not found.");
        setCurrentCategoryName(null);
        setProducts([]);
        setIsLoading(false);
        return;
      }
      
      setCurrentCategoryName(categoryDetails.name);

      getProducts({ categoryFilter: categoryDetails.name })
        .then(result => {
          if (result.error) {
            setError(result.error);
            setProducts([]);
          } else {
            setProducts(result.products);
          }
        })
        .catch(err => {
          console.error("Error fetching category products:", err);
          setError(err.message || "An unexpected error occurred.");
          setProducts([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setProducts([]);
      setIsLoading(false);
      setCurrentCategoryName(null);
    }
  }, [categorySlug]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Loading products for {currentCategoryName || categorySlug}...</p>
      </div>
    );
  }

  if (error && !currentCategoryName) { // Specific error for category not found
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-semibold text-destructive">Category Not Found</p>
        <p className="text-muted-foreground mb-4">The category "{categorySlug}" does not exist.</p>
        <Button asChild variant="outline">
          <Link href="/">Back to Homepage</Link>
        </Button>
      </div>
    );
  }


  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-semibold text-destructive">Error Fetching Products</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">Back to Homepage</Link>
        </Button>
      </div>
    );
  }

  if (!categorySlug || !currentCategoryName) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-lg text-muted-foreground">No category specified.</p>
         <Button asChild variant="link" className="mt-4">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-2">
        {currentCategoryName}
      </h1>
      <p className="text-muted-foreground mb-8">
        {products.length} product(s) found in this category.
      </p>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-muted-foreground">
          <ShoppingBag className="h-16 w-16 mb-6 opacity-50" />
          <p className="text-xl font-medium">No products found in {currentCategoryName}.</p>
          <p className="mt-2">Check back later or explore other categories.</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      )}
    </main>
  );
}

export default function CategoryPage() {
  // Suspense is required by Next.js when using useSearchParams or useParams in client components
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 text-primary animate-spin mb-4" /><p className="text-lg text-muted-foreground">Loading Category...</p></div>}>
      <CategoryResults />
    </Suspense>
  );
}

