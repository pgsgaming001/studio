'use client';

import type { ProductDisplayData } from '@/app/actions/getProductById';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image'; // For potential use in toast

export interface CartItem extends ProductDisplayData {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: ProductDisplayData, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
  isCartReady: boolean; // To indicate if cart is ready after hydration
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('xerox2u-cart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
      // Optionally clear corrupted cart data
      // localStorage.removeItem('xerox2u-cart');
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('xerox2u-cart', JSON.stringify(cartItems));
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
      }
    }
  }, [cartItems, isHydrated]);

  const addToCart = (product: ProductDisplayData, quantity: number = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevItems, { ...product, quantity }];
    });

    toast({
      title: `${product.name} added to cart!`,
      description: (
        <div className="flex items-start gap-3">
          <div className="relative w-12 h-12 rounded overflow-hidden border">
            <Image 
              src={product.image || "https://placehold.co/48x48.png"} 
              alt={product.name} 
              fill 
              className="object-cover"
              sizes="48px"
            />
          </div>
          <div>
            <p className="text-sm font-medium">${product.price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Quantity: {quantity}</p>
          </div>
        </div>
      ),
      action: (
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href="/cart">View Cart</Link>
        </Button>
      ),
      duration: 5000, // Keep toast longer
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    toast({
      title: "Item Removed",
      description: "The item has been removed from your cart.",
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart.",
    });
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getItemCount, isCartReady: isHydrated }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
