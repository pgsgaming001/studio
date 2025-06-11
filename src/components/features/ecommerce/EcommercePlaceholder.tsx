
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ArrowRight, ChevronRight, Search, ShoppingBag, Star, ThumbsUp, Zap, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getProducts, type ProductSummary } from "@/app/actions/getProducts";
import { useCart } from "@/context/CartContext";
import type { ProductDisplayData } from "@/app/actions/getProductById";
import { useRouter } from "next/navigation"; // Import useRouter
import { ProductCard } from "./ProductCard"; // Ensure ProductCard is imported

const placeholderCategories = [
  { name: "Electronics", icon: Zap, dataAiHint: "gadgets technology", slug: "electronics" },
  { name: "Home Goods", icon: ThumbsUp, dataAiHint: "home decor", slug: "home-goods" },
  { name: "Fashion", icon: ShoppingBag, dataAiHint: "apparel clothing", slug: "fashion" },
  { name: "Office", icon: Search, dataAiHint: "office supplies", slug: "office" },
];

interface Product extends ProductSummary {}


export function EcommercePlaceholder() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const cartContext = useCart(); 
  const router = useRouter();

  useEffect(() => {
    const fetchStoreProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const featuredResult = await getProducts({ limit: 8, featuredOnly: true });
        if (featuredResult.error) throw new Error(`Featured products error: ${featuredResult.error}`);
        setFeaturedProducts(featuredResult.products);

        const allResult = await getProducts({ limit: 20 }); // Fetch more for client-side search
        if (allResult.error) throw new Error(`All products error: ${allResult.error}`);
        setAllProducts(allResult.products);

      } catch (err: any) {
        console.error("Error fetching store products:", err);
        setError(err.message || "Failed to load products.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreProducts();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return allProducts;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    return allProducts.filter(product => 
      product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      product.category.toLowerCase().includes(lowerCaseSearchTerm) ||
      (product.tags && product.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm))) ||
      product.description.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [allProducts, searchTerm]);

  if (!cartContext || !cartContext.isCartReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Initializing Store...</p>
      </div>
    );
  }


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Loading Products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 text-center px-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-semibold text-destructive">Could Not Load Products</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <p className="text-sm text-muted-foreground">Please ensure the database is connected and products are available.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-12 md:space-y-16 py-8">
      <section className="text-center px-4">
        <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
          <ShoppingBag className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary mb-3">
          Welcome to Xerox2U Store!
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Discover amazing products, curated collections, and unbeatable deals. Happy shopping!
        </p>
        <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
          <Input
            type="search"
            placeholder="Search for products, brands, and more..."
            className="pl-12 pr-4 h-12 text-base rounded-full shadow-lg focus-visible:ring-primary focus-visible:ring-2 border-border/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <button type="submit" className="sr-only">Search</button>
        </form>
      </section>

      {featuredProducts.length > 0 && (
        <section className="px-0 md:px-0">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline text-3xl font-semibold text-foreground">Featured Picks</h2>
              <Button variant="link" className="text-primary hover:text-primary/80" asChild>
                <Link href="/products"> 
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex space-x-4 md:space-x-6 px-4 container mx-auto">
              {featuredProducts.map((product) => (
                <div key={product.id} className="inline-block w-[280px] sm:w-[300px] h-full">
                   <ProductCard product={product} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="mt-2 container mx-auto px-4" />
          </ScrollArea>
        </section>
      )}

      <section className="container mx-auto px-4">
         <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline text-3xl font-semibold text-foreground">Shop by Category</h2>
           <Button variant="link" className="text-primary hover:text-primary/80" asChild>
              <Link href="/categories">
                All Categories <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {placeholderCategories.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} passHref legacyBehavior>
              <a className="block group">
                <Card 
                  className="overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 rounded-xl aspect-[4/3] flex flex-col items-center justify-center text-center p-4 cursor-pointer group-hover:bg-primary/5"
                  data-ai-hint={category.dataAiHint}
                >
                  <div className="p-3 bg-primary/10 rounded-full mb-3 group-hover:bg-primary/20 transition-colors">
                    <category.icon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                  </div>
                  <p className="font-semibold text-lg text-card-foreground group-hover:text-primary">{category.name}</p>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                </Card>
              </a>
            </Link>
          ))}
        </div>
      </section>
      
      <section className="container mx-auto px-4">
         <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground p-8 md:p-12 rounded-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
                <h3 className="text-3xl md:text-4xl font-bold mb-2">Limited Time Offer!</h3>
                <p className="text-lg md:text-xl opacity-90 mb-4 md:mb-0">Get 25% off on all Electronics. Use code: <span className="font-bold bg-background/20 px-2 py-1 rounded">SUMMER25</span></p>
            </div>
            <Button variant="secondary" size="lg" className="bg-background text-primary hover:bg-background/90 mt-4 md:mt-0 shadow-md text-base shrink-0">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        </div>
      </section>

      {(allProducts.length > 0 || searchTerm) && ( 
        <section className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline text-3xl font-semibold text-foreground">
                  {searchTerm ? `Results for "${searchTerm}"` : "Discover More"}
                </h2>
            </div>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              searchTerm && (
                <div className="text-center py-10 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">No products found matching "{searchTerm}".</p>
                  <p className="text-sm mt-2">Try a different search term or check your spelling.</p>
                </div>
              )
            )}
            {!searchTerm && allProducts.length > 12 && ( 
                 <div className="text-center mt-10">
                    <Button size="lg" variant="outline" className="text-base px-8 py-6 border-2 border-primary text-primary hover:bg-primary/10 hover:text-primary shadow-sm hover:shadow-md transition-shadow">
                        Load More Products
                    </Button>
                </div>
            )}
        </section>
      )}

      {allProducts.length === 0 && !isLoading && !error && !searchTerm && ( 
             <section className="container mx-auto px-4 text-center min-h-[200px] flex flex-col items-center justify-center">
                 <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30 text-muted-foreground" />
                 <h2 className="font-headline text-2xl font-semibold text-muted-foreground mb-2">Our Shelves Are Currently Empty</h2>
                 <p className="text-muted-foreground max-w-md mx-auto">We're working hard to stock up. Please check back soon for exciting products! If you're an admin, you can add products through the dashboard.</p>
             </section>
        )
      }
    </div>
  );
}
