
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ArrowRight, ChevronRight, Search, ShoppingBag, Star, ThumbsUp, Zap, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getProducts, type ProductSummary } from "@/app/actions/getProducts";
import { useToast } from "@/hooks/use-toast";


const placeholderCategories = [
  { name: "Electronics", icon: Zap, dataAiHint: "gadgets technology", slug: "electronics" },
  { name: "Home Goods", icon: ThumbsUp, dataAiHint: "home decor", slug: "home-goods" },
  { name: "Fashion", icon: ShoppingBag, dataAiHint: "apparel clothing", slug: "fashion" },
  { name: "Office", icon: Search, dataAiHint: "office supplies", slug: "office" },
];

interface Product extends ProductSummary {}


const ProductCard = ({ product }: { product: Product }) => {
  const { toast } = useToast();
  const filledStars = product.rating ? Math.floor(product.rating) : 0;
  const hasHalfStar = product.rating ? product.rating % 1 !== 0 : false;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent Link navigation if button is inside Link
    e.stopPropagation(); // Stop event bubbling
    toast({
      title: "Product Added!",
      description: `${product.name} has been added to your cart. (Placeholder)`,
    });
    console.log("Add to cart clicked for (from ProductCard):", product.name);
  };

  return (
    <Link href={`/product/${product.id}`} passHref legacyBehavior>
      <a className="block h-full group">
        <Card className="overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 rounded-xl flex flex-col h-full bg-card">
          <div className="relative w-full aspect-square bg-secondary overflow-hidden">
            <Image
              src={product.image || "https://placehold.co/400x400.png"}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
              className="group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={product.dataAiHint || product.name.split(" ").slice(0,2).join(" ")}
            />
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                SALE
              </div>
            )}
          </div>
          <CardHeader className="p-4 flex-grow">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.category}</p>
            <CardTitle className="text-lg font-semibold text-card-foreground mt-1 leading-tight h-12 overflow-hidden group-hover:text-primary transition-colors">
              {product.name}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1 h-10 overflow-hidden">
              {product.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {product.rating && product.rating > 0 && (
            <div className="flex items-center mb-2">
              {[...Array(filledStars)].map((_, i) => (
                <Star key={`filled-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              ))}
              {hasHalfStar && <Star key="half" className="h-4 w-4 text-yellow-400 fill-yellow-200" />}
              {[...Array(5 - filledStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
                <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground/50 fill-muted-foreground/20" />
              ))}
              <span className="ml-2 text-xs text-muted-foreground">({product.rating.toFixed(1)})</span>
            </div>
            )}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xl font-bold text-primary">
                  ${product.price.toFixed(2)}
                </p>
                {product.originalPrice && product.originalPrice > product.price && (
                  <p className="text-xs text-muted-foreground line-through">
                    ${product.originalPrice.toFixed(2)}
                  </p>
                )}
              </div>
              <Button 
                size="sm" 
                variant="default" 
                className="shadow-md hover:shadow-lg transition-shadow z-10"
                onClick={handleAddToCart}
              >
                <ShoppingBag className="mr-1.5 h-4 w-4" /> Add to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </a>
    </Link>
  );
};


export function EcommercePlaceholder() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStoreProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const featuredResult = await getProducts({ limit: 8, featuredOnly: true });
        if (featuredResult.error) throw new Error(`Featured products error: ${featuredResult.error}`);
        setFeaturedProducts(featuredResult.products);

        const allResult = await getProducts({ limit: 12 }); 
        if (allResult.error) throw new Error(`All products error: ${allResult.error}`);
        setAllProducts(allResult.products);

      } catch (err: any) {
        console.error("Error fetching store products:", err);
        setError(err.message || "Failed to load products.");
        toast({
          title: "Error Loading Products",
          description: err.message || "Could not load products from the store.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreProducts();
  }, [toast]);

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
          Welcome to Our Store!
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Discover amazing products, curated collections, and unbeatable deals. Happy shopping!
        </p>
        <div className="relative max-w-xl mx-auto">
          <Input
            type="search"
            placeholder="Search for products, brands, and more..."
            className="pl-12 pr-4 h-12 text-base rounded-full shadow-lg focus-visible:ring-primary focus-visible:ring-2 border-border/50"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="px-4 md:px-0">
          <div className="flex justify-between items-center mb-6 px-0 md:px-4">
            <h2 className="font-headline text-3xl font-semibold text-foreground">Featured Picks</h2>
            <Button variant="link" className="text-primary hover:text-primary/80">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex space-x-4 md:space-x-6 px-0 md:px-4">
              {featuredProducts.map((product) => (
                <div key={product.id} className="inline-block w-[280px] sm:w-[300px] h-full">
                   <ProductCard product={product} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="mt-2" />
          </ScrollArea>
        </section>
      )}

      <section className="px-4">
         <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline text-3xl font-semibold text-foreground">Shop by Category</h2>
           <Button variant="link" className="text-primary hover:text-primary/80">
              All Categories <ArrowRight className="ml-1 h-4 w-4" />
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
      
      <section className="px-4">
         <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground p-8 md:p-12 rounded-xl shadow-xl flex flex-col md:flex-row items-center justify-between">
            <div>
                <h3 className="text-3xl md:text-4xl font-bold mb-2">Limited Time Offer!</h3>
                <p className="text-lg md:text-xl opacity-90 mb-4 md:mb-0">Get 25% off on all Electronics. Use code: <span className="font-bold bg-background/20 px-2 py-1 rounded">SUMMER25</span></p>
            </div>
            <Button variant="secondary" size="lg" className="bg-background text-primary hover:bg-background/90 mt-4 md:mt-0 shadow-md text-base">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
        </div>
      </section>

      {allProducts.length > 0 ? (
        <section className="px-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline text-3xl font-semibold text-foreground">Discover More</h2>
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                    Filter & Sort
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {allProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
            </div>
            <div className="text-center mt-10">
                <Button size="lg" variant="outline" className="text-base px-8 py-6 border-2 border-primary text-primary hover:bg-primary/10 hover:text-primary shadow-sm hover:shadow-md transition-shadow">
                    Load More Products
                </Button>
            </div>
        </section>
      ) : (
        !isLoading && !error && ( 
             <section className="px-4 text-center min-h-[200px] flex flex-col items-center justify-center">
                 <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30 text-muted-foreground" />
                 <h2 className="font-headline text-2xl font-semibold text-muted-foreground mb-2">Our Shelves Are Currently Empty</h2>
                 <p className="text-muted-foreground max-w-md mx-auto">We're working hard to stock up. Please check back soon for exciting products! If you're an admin, you can add products through the dashboard.</p>
             </section>
        )
      )}
    </div>
  );
}
