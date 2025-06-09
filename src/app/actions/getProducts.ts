
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
  stock?: number; // Added stock
  status?: 'active' | 'inactive' | 'draft'; // Added status
}

// This interface matches the MongoDB document structure for products
interface ProductMongo extends Omit<ProductSummary, 'id' | 'dataAiHint'> {
  _id: ObjectId;
  // dataAiHint is not stored in DB, generated on client or not used for admin
  images?: string[]; // Array of images for product detail page
  reviews?: {
    user: string;
    comment: string;
    rating: number;
    date: Date | string;
  }[];
  tags?: string[];
  // isFeatured is already in ProductSummary
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
    
    let cursor = productsCollection.find(query);

    if (limit) {
      cursor = cursor.limit(limit);
    }
    // Optionally, add sorting, e.g., .sort({ createdAt: -1 }) if you have a createdAt field

    const fetchedProducts = await cursor.toArray();

    const displayProducts: ProductSummary[] = fetchedProducts.map(product => {
      const { _id, description, ...restOfProduct } = product;
      return {
        ...restOfProduct,
        id: _id.toString(),
        description: description, // Return full description
        // Ensure all other fields expected by ProductSummary are present
        // (name, price, image, category are already in restOfProduct if mapped from ProductSummary)
        // stock and status are also in restOfProduct if present in ProductMongo
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
