"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

export interface CartItem {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  farmerId: number;
  farmerName: string;
  image?: string;
  stockQuantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: any, quantity: number = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === product.id);
      
      if (existingItem) {
        // Check stock limit
        const newQuantity = existingItem.quantity + quantity;
        if (product.stockQuantity && newQuantity > product.stockQuantity) {
          alert(`Only ${product.stockQuantity} items available in stock`);
          return prevItems;
        }
        
        // Update quantity if already in cart
        return prevItems.map(item =>
          item.productId === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Check stock limit
        if (product.stockQuantity && quantity > product.stockQuantity) {
          alert(`Only ${product.stockQuantity} items available in stock`);
          return prevItems;
        }
        
        // Add new item
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: quantity,
          unit: product.unit || 'kg',
          farmerId: product.farmer?.id || 0,
          farmerName: product.farmer?.first_name 
            ? `${product.farmer.first_name} ${product.farmer.last_name || ''}`
            : "Verified Farmer",
          stockQuantity: product.stockQuantity || 0
        };
        return [...prevItems, newItem];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          // Check stock limit
          if (item.stockQuantity && quantity > item.stockQuantity) {
            alert(`Only ${item.stockQuantity} items available in stock`);
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      setItems([]);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}