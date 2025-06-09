
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define the structure of a product, similar to what's in EcommercePlaceholder
// This should match your MongoDB 'products' collection schema
export interface Product {
  _id: ObjectId; // MongoDB's default ID
  id?: string; // String version of _id for client-side use
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string; // Main image for card view
  images?: string[]; // Array of images for product detail page
  category: string;
  rating?: number;
  reviews?: {
    user: string;
    comment: string;
    rating: number;
    date: Date | string; // Store as Date in DB, convert to string for client
  }[];
  relatedProductIds?: string[]; // IDs of related products
  isFeatured?: boolean;
  stock?: number;
  // Add any other fields you need
}

// Define the structure of the data returned to the client
export interface ProductDisplayData extends Omit<Product, '_id' | 'reviews' | 'relatedProductIds'> {
  id: string; // ensure _id is converted to string
  reviews?: {
    user: string;
    comment: string;
    rating: number;
    date: string; // Dates will be stringified
  }[];
  // relatedProducts would be fetched separately or populated if needed
}


export async function getProductById(productId: string): Promise<{ product: ProductDisplayData | null; error?: string }> {
  if (!productId || !ObjectId.isValid(productId)) {
    return { product: null, error: 'Invalid Product ID format.' };
  }

  try {
    const { db } = await connectToDatabase();
    const productsCollection = db.collection<Product>('products');
    
    const productDocument = await productsCollection.findOne({ _id: new ObjectId(productId) });

    if (!productDocument) {
      return { product: null, error: 'Product not found.' };
    }

    // Convert MongoDB document to client-friendly format
    const { _id, reviews, ...restOfProduct } = productDocument;
    
    const displayProduct: ProductDisplayData = {
      ...restOfProduct,
      id: _id.toString(),
      reviews: reviews?.map(review => ({
        ...review,
        date: review.date instanceof Date ? review.date.toISOString() : review.date,
      })),
    };
    
    return { product: displayProduct };
  } catch (error: any) {
    console.error("Error fetching product from MongoDB:", error);
    return { 
      product: null, 
      error: `Failed to fetch product: ${error.message || 'Unknown database error'}` 
    };
  }
}

    