
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { ObjectId } from 'mongodb';

// This interface should align with what ProductCard expects and what getProductById provides
// It's essentially ProductDisplayData but potentially as an array
export interface ProductSummary {
  id: string; // String version of _id
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating?: number;
  isFeatured?: boolean;
  dataAiHint?: string;
}

// This interface matches the MongoDB document structure for products
interface ProductMongo extends Omit<ProductSummary, 'id' | 'description'> {
  _id: ObjectId;
  description: string; // Keep full description here
  images?: string[];
  reviews?: {
    user: string;
    comment: string;
    rating: number;
    date: Date | string; // Store as Date in DB, convert to string for client
  }[];
  stock?: number;
  // Add other fields that exist in your MongoDB products collection
}


export async function getProducts(
  { limit, featuredOnly }: { limit?: number; featuredOnly?: boolean } = {}
): Promise<{ products: ProductSummary[]; error?: string }> {
  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection<ProductMongo>('products');
    
    const query = featuredOnly ? { isFeatured: true } : {};
    
    let cursor = productsCollection.find(query);

    if (limit) {
      cursor = cursor.limit(limit);
    }
    // Optionally, add sorting, e.g., .sort({ createdAt: -1 }) if you have a createdAt field

    const fetchedProducts = await cursor.toArray();

    const displayProducts: ProductSummary[] = fetchedProducts.map(product => {
      const { _id, ...restOfProduct } = product;
      return {
        ...restOfProduct,
        id: _id.toString(),
        // For ProductCard, we might want a snippet of the description
        description: restOfProduct.description.length > 100 
          ? restOfProduct.description.substring(0, 100) + "..." 
          : restOfProduct.description,
        // Ensure all other fields expected by ProductSummary are present
      };
    });
    
    return { products: displayProducts };
  } catch (error: any) {
    console.error("Error fetching products from MongoDB:", error);
    return { 
      products: [], 
      error: `Failed to fetch products: ${error.message || 'Unknown database error'}` 
    };
  }
}
