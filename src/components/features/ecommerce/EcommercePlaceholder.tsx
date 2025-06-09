
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ArrowRight, ChevronRight, Search, ShoppingBag, Star, ThumbsUp, Zap } from "lucide-react";
import Link from "next/link"; // Added Link

const placeholderCategories = [
  { name: "Electronics", icon: Zap, dataAiHint: "gadgets technology", slug: "electronics" },
  { name: "Home Goods", icon: ThumbsUp, dataAiHint: "home decor", slug: "home-goods" },
  { name: "Fashion", icon: ShoppingBag, dataAiHint: "apparel clothing", slug: "fashion" },
  { name: "Office", icon: Search, dataAiHint: "office supplies", slug: "office" },
];

// This data is now a placeholder. Real data will come from MongoDB.
// Ensure your MongoDB `products` collection has documents with similar fields,
// especially an `_id` (which MongoDB provides) or a unique `productId` string.
const placeholderProducts = [
  {
    id: "prod_1", // Use a string ID that can be part of a URL
    name: "Smart Noise-Cancelling Headphones",
    description: "Immersive sound experience with adaptive noise cancellation. Multiple colors available. Long battery life.",
    price: 199.99,
    originalPrice: 249.99,
    image: "https://placehold.co/400x400/E0E7FF/4F46E5.png?text=Headphones",
    category: "Electronics",
    rating: 4.5,
    isFeatured: true,
    dataAiHint: "headphones audio",
  },
  {
    id: "prod_2",
    name: "Ergonomic Mesh Office Chair",
    description: "Supportive and breathable chair for long working hours. Adjustable height and lumbar support.",
    price: 279.00,
    image: "https://placehold.co/400x400/DBEAFE/1D4ED8.png?text=Office+Chair",
    category: "Office",
    rating: 4.8,
    isFeatured: true,
    dataAiHint: "office chair",
  },
  {
    id: "prod_3",
    name: "Minimalist Ceramic Vase Set",
    description: "Elegant set of 3 ceramic vases for modern home decor. Perfect for flowers or as standalone pieces.",
    price: 45.50,
    image: "https://placehold.co/400x400/BFDBFE/1E40AF.png?text=Vase+Set",
    category: "Home Goods",
    rating: 4.2,
    isFeatured: false,
    dataAiHint: "ceramic vase",
  },
  {
    id: "prod_4",
    name: "Organic Cotton Graphic T-Shirt",
    description: "Comfortable and stylish tee with a unique design. Made from 100% organic cotton.",
    price: 29.99,
    image: "https://placehold.co/400x400/93C5FD/1E3A8A.png?text=T-Shirt",
    category: "Fashion",
    rating: 4.0,
    isFeatured: true,
    dataAiHint: "graphic t-shirt",
  },
  {
    id: "prod_5",
    name: "Portable SSD - 1TB",
    description: "Fast and reliable portable storage for your files. USB-C interface.",
    price: 89.99,
    image: "https://placehold.co/400x400/A5B4FC/3730A3.png?text=SSD",
    category: "Electronics",
    rating: 4.9,
    isFeatured: false,
    dataAiHint: "portable ssd",
  },
  {
    id: "prod_6",
    name: "Modern Wooden Desk Lamp",
    description: "Adjustable arm with a warm LED light, perfect for study or work. Energy efficient.",
    price: 65.00,
    image: "https://placehold.co/400x400/C7D2FE/4338CA.png?text=Desk+Lamp",
    category: "Office",
    rating: 4.6,
    isFeatured: false,
    dataAiHint: "desk lamp",
  },
  {
    id: "prod_7",
    name: "Cozy Knit Throw Blanket",
    description: "Soft and warm, ideal for chilly evenings. Large size, machine washable.",
    price: 59.00,
    image: "https://placehold.co/400x400/E0E7FF/4F46E5.png?text=Blanket",
    category: "Home Goods",
    rating: 4.7,
    isFeatured: true,
    dataAiHint: "throw blanket",
  },
  {
    id: "prod_8",
    name: "Classic Canvas Sneakers",
    description: "Versatile and comfortable for everyday wear. Available in multiple sizes.",
    price: 75.00,
    image: "https://placehold.co/400x400/DBEAFE/1D4ED8.png?text=Sneakers",
    category: "Fashion",
    rating: 4.3,
    isFeatured: false,
    dataAiHint: "canvas sneakers",
  },
];

// Define a more complete product type, which you should match in your MongoDB schema
interface Product {
  id: string; // This will be MongoDB's _id as a string
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string; // For ProductCard, assuming one primary image. Detail page might use an array.
  images?: string[]; // For product detail page
  category: string;
  rating?: number;
  isFeatured?: boolean;
  dataAiHint?: string;
  // Add other fields as needed for product details page
  reviews?: { user: string; comment: string; rating: number; date: string }[];
  relatedProductIds?: string[];
  stock?: number;
}


const ProductCard = ({ product }: { product: Product }) => {
  const filledStars = product.rating ? Math.floor(product.rating) : 0;
  const hasHalfStar = product.rating ? product.rating % 1 !== 0 : false;

  return (
    // Wrap Card with Link component
    <Link href={`/product/${product.id}`} passHref legacyBehavior>
      <a className="block h-full group">
        <Card className="overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 rounded-xl flex flex-col h-full bg-card">
          <div className="relative w-full aspect-square bg-secondary overflow-hidden">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
              className="group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={product.dataAiHint}
            />
            {product.originalPrice && (
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
            {product.rating && (
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
                {product.originalPrice && (
                  <p className="text-xs text-muted-foreground line-through">
                    ${product.originalPrice.toFixed(2)}
                  </p>
                )}
              </div>
              {/* Prevent Link navigation when clicking button inside the card */}
              <Button 
                size="sm" 
                variant="default" 
                className="shadow-md hover:shadow-lg transition-shadow z-10"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); console.log("Add to cart clicked for:", product.name); /* Add to cart logic here */ }}
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
  // For now, we use placeholderProducts. In a real app, you'd fetch these from MongoDB.
  // e.g., const [products, setProducts] = useState<Product[]>([]);
  // useEffect(() => { /* fetch products */ }, []);

  const featuredProducts = placeholderProducts.filter(p => p.isFeatured);

  return (
    <div className="space-y-12 md:space-y-16 py-8">
      {/* Hero Section */}
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

      {/* Featured Products Section */}
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
                   <ProductCard product={product as Product} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="mt-2" />
          </ScrollArea>
        </section>
      )}

      {/* Shop by Category Section */}
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
      
      {/* Special Offer Banner Example - Could be more dynamic */}
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


      {/* All Products Section */}
      <section className="px-4">
        <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline text-3xl font-semibold text-foreground">Discover More</h2>
             <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                Filter & Sort
            </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {placeholderProducts.map((product) => (
             <ProductCard key={product.id} product={product as Product} />
          ))}
        </div>
        <div className="text-center mt-10">
            <Button size="lg" variant="outline" className="text-base px-8 py-6 border-2 border-primary text-primary hover:bg-primary/10 hover:text-primary shadow-sm hover:shadow-md transition-shadow">
                Load More Products
            </Button>
        </div>
      </section>
    </div>
  );
}

    