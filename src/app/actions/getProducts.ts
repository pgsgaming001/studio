
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
  tags?: string[]; 
  images?: string[]; 
}

// This interface matches the MongoDB document structure for products
export interface ProductMongo {
  _id: ObjectId;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string; 
  images?: string[]; 
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
  createdAt?: Date; 
  updatedAt?: Date; 
}


export async function getProducts(
  { limit, featuredOnly, categoryFilter, searchQuery }: { limit?: number; featuredOnly?: boolean; categoryFilter?: string, searchQuery?: string } = {}
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
    if (searchQuery) {
      const searchRegex = { $regex: searchQuery, $options: 'i' }; // 'i' for case-insensitive
      query.$or = [
        { name: searchRegex },
        { category: searchRegex },
        { description: searchRegex }, // Optional: search description
        { tags: searchRegex } // Optional: search tags (if tags array contains strings)
      ];
    }
    
    let cursor = productsCollection.find(query).sort({ createdAt: -1 }); 

    if (limit) {
      cursor = cursor.limit(limit);
    }
    
    const fetchedProducts = await cursor.toArray();

    const displayProducts: ProductSummary[] = fetchedProducts.map(product => {
      const { _id, ...restOfProduct } = product;
      return {
        ...restOfProduct,
        id: _id.toString(),
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
