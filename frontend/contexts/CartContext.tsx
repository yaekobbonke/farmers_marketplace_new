// contexts/CartContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: number;
  productId?: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
  totalItems: number; // 👈 FIXED: Added totalItems to type interface
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
        console.log('Loaded cart from localStorage:', parsedCart);
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
    console.log('Saved cart to localStorage:', items);
  }, [items]);

  const addToCart = (product: any, quantity: number) => {
    console.log('Adding to cart:', product, quantity);
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        const updatedItems = prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        console.log('Updated existing item:', updatedItems);
        return updatedItems;
      } else {
        const newItem = {
          id: product.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          unit: product.unit || 'kg',
          image: product.name
        };
        const updatedItems = [...prevItems, newItem];
        console.log('Added new item:', updatedItems);
        return updatedItems;
      }
    });
  };

  const removeFromCart = (productId: number) => {
    console.log('Removing item with ID:', productId);
    console.log('Current items before removal:', items);
    
    setItems(prevItems => {
      const filteredItems = prevItems.filter(item => item.id !== productId);
      console.log('Items after removal:', filteredItems);
      return filteredItems;
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    console.log('Updating quantity for product:', productId, 'to', quantity);
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    console.log('Clearing cart');
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // 👈 FIXED: Calculate the cumulative sum of quantities for the badge count
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      total,
      totalItems // 👈 FIXED: Provided value to consumers
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}