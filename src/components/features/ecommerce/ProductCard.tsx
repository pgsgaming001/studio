
"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Star } from "lucide-react";
import type { ProductSummary } from "@/app/actions/getProducts";
import { useCart } from "@/context/CartContext";
import type { ProductDisplayData } from "@/app/actions/getProductById";

interface Product extends ProductSummary {}

export const ProductCard = ({ product }: { product: Product }) => {
  const cartContext = useCart();
  const filledStars = product.rating ? Math.floor(product.rating) : 0;
  const hasHalfStar = product.rating ? product.rating % 1 !== 0 : false;
  
  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    if (cartContext) {
      cartContext.addToCart(product as unknown as ProductDisplayData);
    } else {
      console.error("Cart context not available");
    }
  };

  return (
    <Link href={`/product/${product.id}`} passHref legacyBehavior>
      <a className="block group">
        <Card className="overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 rounded-xl flex flex-col bg-card h-[420px]">
          <div className="relative w-full aspect-square bg-secondary overflow-hidden">
            <Image
              src={product.image || "https://placehold.co/400x400.png"}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={product.dataAiHint || product.name.split(" ").slice(0,2).join(" ")}
            />
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                SALE
              </div>
            )}
             {(!product.stock || product.stock <= 0) && (
              <div className="absolute bottom-2 left-2 bg-slate-700/80 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
                Out of Stock
              </div>
            )}
          </div>
          <CardHeader className="p-4 flex-grow overflow-hidden">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.category}</p>
            <CardTitle className="text-lg font-semibold text-card-foreground mt-1 leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-3">
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
                disabled={!product.stock || product.stock <= 0}
              >
                <ShoppingBag className="mr-1.5 h-4 w-4" /> 
                {product.stock && product.stock > 0 ? "Add" : "Sold Out"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </a>
    </Link>
  );
};
