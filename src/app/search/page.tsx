
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getProducts, type ProductSummary } from "@/app/actions/getProducts";
import { ProductCard } from "@/components/features/ecommerce/ProductCard"; // We'll need to extract ProductCard
import { Loader2, Search, AlertTriangle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ProductCard component needs to be usable here.
// If it's not already in a separate file, it should be extracted from EcommercePlaceholder.tsx
// For now, I'll assume it's extracted or define a similar one.
// Let's assume ProductCard is extracted to "@/components/features/ecommerce/ProductCard.tsx"

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      setIsLoading(true);
      setError(null);
      getProducts({ searchQuery: query })
        .then(result => {
          if (result.error) {
            setError(result.error);
            setProducts([]);
          } else {
            setProducts(result.products);
          }
        })
        .catch(err => {
          console.error("Error fetching search results:", err);
          setError(err.message || "An unexpected error occurred.");
          setProducts([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setProducts([]);
      setIsLoading(false);
    }
  }, [query]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Searching for "{query}"...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-semibold text-destructive">Error Fetching Results</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">Back to Homepage</Link>
        </Button>
      </div>
    );
  }

  if (!query) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
        <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-lg text-muted-foreground">Please enter a search term to find products.</p>
         <Button asChild variant="link" className="mt-4">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-2">
        Search Results for "{query}"
      </h1>
      <p className="text-muted-foreground mb-8">
        {products.length} product(s) found.
      </p>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            // This assumes ProductCard is extracted and can be used here
            // If not, you'd replicate its structure or pass it as a prop
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center text-muted-foreground">
          <ShoppingBag className="h-16 w-16 mb-6 opacity-50" />
          <p className="text-xl font-medium">No products match your search criteria.</p>
          <p className="mt-2">Try a different search term, or check for typos.</p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    // Suspense is required by Next.js when using useSearchParams
    <Suspense fallback={<Loader2 className="h-12 w-12 text-primary animate-spin mx-auto my-20" />}>
      <SearchResults />
    </Suspense>
  );
}
