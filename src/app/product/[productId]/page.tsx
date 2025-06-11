
"use client";

import { useEffect, useState } from "react";
import { useParams } from 'next/navigation'; 
import { getProductById, type ProductDisplayData } from "@/app/actions/getProductById";
import { getProducts, type ProductSummary } from "@/app/actions/getProducts"; // Import getProducts
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, ShoppingBag, AlertTriangle, Info, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { useCart } from "@/context/CartContext"; 
import { ProductCard } from "@/components/features/ecommerce/ProductCard"; // Import ProductCard

const StarRating = ({ rating, reviewCount }: { rating?: number; reviewCount?: number }) => {
  if (typeof rating !== 'number' || rating <= 0) {
    return <span className="text-sm text-muted-foreground">No reviews yet</span>;
  }
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      ))}
      {halfStar && <Star key="half" className="h-5 w-5 fill-yellow-400 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-5 w-5 text-yellow-300" />
      ))}
      {reviewCount !== undefined && <span className="ml-2 text-sm text-muted-foreground">({reviewCount} reviews)</span>}
    </div>
  );
};


export default function ProductPage() { 
  const params = useParams(); 
  const productId = params.productId as string; 

  const cartContext = useCart(); 
  const [product, setProduct] = useState<ProductDisplayData | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);


  useEffect(() => {
    const fetchProductAndRelated = async () => {
      if (!productId) { 
        setIsLoading(false);
        setError("Product ID is missing.");
        return;
      }
      setIsLoading(true);
      setIsLoadingRelated(true);
      setError(null);
      setProduct(null);
      setRelatedProducts([]);

      const result = await getProductById(productId);
      if (result.error) {
        setError(result.error);
        setProduct(null);
      } else if (result.product) {
        setProduct(result.product);
        if (result.product.images && result.product.images.length > 0) {
          setSelectedImage(result.product.images[0]);
        } else if (result.product.image) {
          setSelectedImage(result.product.image);
        }

        // Fetch related products
        if (result.product.category) {
          getProducts({ categoryFilter: result.product.category, limit: 5 }) // Limit to 5, one might be current product
            .then(relatedResult => {
              if (relatedResult.products) {
                // Filter out the current product and take top 4
                setRelatedProducts(relatedResult.products.filter(p => p.id !== productId).slice(0, 4));
              }
              setIsLoadingRelated(false);
            })
            .catch(err => {
              console.error("Error fetching related products:", err);
              setIsLoadingRelated(false);
            });
        } else {
          setIsLoadingRelated(false);
        }
      } else {
        // Product not found, but no specific error from getProductById (e.g. ID was valid but not in DB)
        setProduct(null); // Already null, but explicit
        setError("Product not found."); // Set a generic error if needed
      }
      setIsLoading(false);
    };

    fetchProductAndRelated();
  }, [productId]); 
  
  if (!cartContext || !cartContext.isCartReady) {
     return (
      <main className="container mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center text-center">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading Cart & Product Details...</p>
      </main>
    );
  }
  const { addToCart } = cartContext;


  const handleAddToCart = () => {
    if (product) {
      addToCart(product); 
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center text-center">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Loading Product Details...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Error Fetching Product</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
          </Link>
        </Button>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container mx-auto px-4 py-12 min-h-screen flex flex-col items-center justify-center text-center">
        <Info className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">The product you are looking for does not exist or may have been removed.</p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
          </Link>
        </Button>
      </main>
    );
  }

  const displayImage = selectedImage || (product.images && product.images.length > 0 ? product.images[0] : product.image);

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
       <div className="mb-6">
        <Button asChild variant="outline" size="sm" className="text-muted-foreground hover:text-primary">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Products
          </Link>
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl shadow-lg border bg-secondary">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority 
                data-ai-hint={product.name} 
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <ShoppingBag className="h-24 w-24 text-muted-foreground opacity-50" />
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`relative aspect-square rounded-md overflow-hidden border hover:border-primary cursor-pointer ${selectedImage === img ? 'border-primary ring-2 ring-primary' : 'border-border'}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <Image src={img} alt={`${product.name} thumbnail ${idx + 1}`} fill className="object-cover" sizes="10vw"/>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Badge variant="secondary" className="text-sm">{product.category}</Badge>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary">{product.name}</h1>
            <div className="flex items-center gap-2 pt-1">
              <StarRating rating={product.rating} reviewCount={product.reviews?.length} />
            </div>
          </div>

          <p className="text-3xl font-semibold text-foreground">
            ${product.price.toFixed(2)}
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="ml-2 text-xl text-muted-foreground line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </p>
          
          <Separator />

          <div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">Description</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {product.description || "No description available."}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              size="lg" 
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground text-base shadow-md"
              onClick={handleAddToCart}
              disabled={!product.stock || product.stock <= 0}
            >
              <ShoppingBag className="mr-2 h-5 w-5" /> 
              {product.stock && product.stock > 0 ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
           <p className="text-sm text-muted-foreground">
            {product.stock && product.stock > 0 
              ? `In Stock: ${product.stock} units available` 
              : product.stock === 0 
                ? <span className="text-destructive font-medium">Currently Out of Stock</span>
                : "Stock information unavailable"
            }
          </p>
        </div>
      </div>

      {product.reviews && product.reviews.length > 0 && (
        <section className="mt-12 md:mt-16">
          <h2 className="font-headline text-2xl md:text-3xl font-semibold text-foreground mb-6">Customer Reviews</h2>
          <div className="space-y-6">
            {product.reviews.map((review, index) => (
              <Card key={index} className="shadow-md rounded-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{review.user || "Anonymous"}</CardTitle>
                    <StarRating rating={review.rating} />
                  </div>
                  <CardDescription>
                    {format(new Date(review.date), "MMMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 md:mt-16">
        <h2 className="font-headline text-2xl md:text-3xl font-semibold text-foreground mb-6">You Might Also Like</h2>
        {isLoadingRelated ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <Card key={`placeholder-${i}`} className="h-[300px] flex items-center justify-center bg-secondary/30 rounded-xl">
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin"/>
              </Card>
            ))}
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map(relatedProd => (
              <ProductCard key={relatedProd.id} product={relatedProd} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center">No related products found in this category.</p>
        )}
      </section>
    </main>
  );
}
