
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ShoppingBag, Search } from "lucide-react";

const placeholderProducts = [
  {
    id: 1,
    name: "Modern Desk Lamp",
    description: "Sleek and minimalist design, perfect for any workspace.",
    price: "$49.99",
    image: "https://placehold.co/300x300/E0E7FF/4F46E5.png?text=Lamp",
    dataAiHint: "desk lamp",
  },
  {
    id: 2,
    name: "Wireless Ergonomic Mouse",
    description: "Comfortable and responsive, designed for long hours of use.",
    price: "$34.50",
    image: "https://placehold.co/300x300/DBEAFE/1D4ED8.png?text=Mouse",
    dataAiHint: "computer mouse",
  },
  {
    id: 3,
    name: "Indoor Plant Pot",
    description: "Stylish ceramic pot to brighten up your home or office.",
    price: "$22.00",
    image: "https://placehold.co/300x300/BFDBFE/1E40AF.png?text=Plant+Pot",
    dataAiHint: "plant pot",
  },
   {
    id: 4,
    name: "Minimalist Wall Clock",
    description: "Elegant and silent wall clock with a modern touch.",
    price: "$55.75",
    image: "https://placehold.co/300x300/93C5FD/1E3A8A.png?text=Clock",
    dataAiHint: "wall clock",
  },
];

export function EcommercePlaceholder() {
  return (
    <div className="space-y-8">
      <Card className="text-center bg-card shadow-lg rounded-xl">
        <CardHeader className="p-6 md:p-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
            <ShoppingBag className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl md:text-4xl text-primary">
            Our Online Store
          </CardTitle>
          <CardDescription className="text-muted-foreground text-base md:text-lg mt-2 max-w-xl mx-auto">
            Browse our curated selection of products. More exciting items are added regularly!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
           <div className="relative max-w-md mx-auto mb-8">
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-10 h-11 text-base rounded-lg shadow-inner"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {placeholderProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 rounded-lg flex flex-col">
                <div className="relative w-full h-56 bg-secondary">
                  <Image
                    src={product.image}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={product.dataAiHint}
                  />
                </div>
                <CardHeader className="p-4 flex-grow">
                  <CardTitle className="text-lg font-semibold text-card-foreground">{product.name}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1 h-10 overflow-hidden">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xl font-bold text-primary">{product.price}</p>
                    <Button size="sm" variant="outline" className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 hover:border-primary/50">
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
           <Button variant="link" className="mt-8 text-primary mx-auto block">
            View All Products &rarr;
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Need to add Input component if not globally available
// For now, let's assume it's available or define a simple one.
// If XeroxForm has Input, this should be fine.
// If not, and you get an error, we might need to import it:
import { Input } from "@/components/ui/input";
