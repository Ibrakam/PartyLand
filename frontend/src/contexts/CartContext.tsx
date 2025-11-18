"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  withHelium?: boolean;
  variantLabel?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: number, withHelium?: boolean) => void;
  updateQuantity: (id: number, quantity: number, withHelium?: boolean) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("partyland_cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to load cart:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("partyland_cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (i) =>
          i.id === item.id &&
          Boolean(i.withHelium) === Boolean(item.withHelium)
      );
      
      if (existingItem) {
        return currentItems.map((i) =>
          i.id === item.id && Boolean(i.withHelium) === Boolean(item.withHelium)
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      
      return [...currentItems, { ...item, quantity }];
    });
  };

  const removeItem = (id: number, withHelium?: boolean) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          item.id !== id || Boolean(item.withHelium) !== Boolean(withHelium)
      )
    );
  };

  const updateQuantity = (id: number, quantity: number, withHelium?: boolean) => {
    if (quantity <= 0) {
      removeItem(id, withHelium);
      return;
    }
    
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id && Boolean(item.withHelium) === Boolean(withHelium)
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
