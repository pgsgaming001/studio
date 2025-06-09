
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { ObjectId } from 'mongodb';

// This interface is for the product data displayed in lists (e.g., storefront cards, admin list)
export interface ProductSummary {
  id: string; // String version of _id
  name: string;
  description: string; // Full description
  price: number;
  originalPrice?: number;
  image: string; // Main image for card/thumbnail view
  category: string;
  rating?: number;
  isFeatured?: boolean;
  dataAiHint?: string;
  stock?: number; 
  status?: 'active' | 'inactive' | 'draft'; 
  tags?: string[]; // Added tags
  images?: string[]; // Added images array for consistency, though product card might only use one
}

// This interface matches the MongoDB document structure for products
// It should fully encompass ProductSummary fields plus MongoDB specific ones
export interface ProductMongo {
  _id: ObjectId;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string; // Main image
  images?: string[]; // Array of all image URLs
  category: string;
  rating?: number;
  reviews?: {
    user: string;
    comment: string;
    rating: number;
    date: Date | string;
  }[];
  isFeatured?: boolean;
  stock?: number;
  status?: 'active' | 'inactive' | 'draft';
  tags?: string[];
  createdAt?: Date; // Optional: for sorting or display
  updatedAt?: Date; // Optional: for tracking updates
  // dataAiHint is not stored in DB
}


export async function getProducts(
  { limit, featuredOnly, categoryFilter }: { limit?: number; featuredOnly?: boolean; categoryFilter?: string } = {}
): Promise<{ products: ProductSummary[]; error?: string }> {
  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection<ProductMongo>('products');
    
    const query: any = {};
    if (featuredOnly) {
      query.isFeatured = true;
    }
    if (categoryFilter) {
      query.category = categoryFilter;
    }
    
    let cursor = productsCollection.find(query).sort({ createdAt: -1 }); // Sort by newest first if createdAt exists

    if (limit) {
      cursor = cursor.limit(limit);
    }
    
    const fetchedProducts = await cursor.toArray();

    const displayProducts: ProductSummary[] = fetchedProducts.map(product => {
      const { _id, ...restOfProduct } = product;
      return {
        ...restOfProduct,
        id: _id.toString(),
        // Ensure all fields required by ProductSummary are present
        // name, description, price, image, category, stock, status, tags, images, originalPrice, isFeatured, rating
        // are expected to be in restOfProduct if they exist in ProductMongo
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
