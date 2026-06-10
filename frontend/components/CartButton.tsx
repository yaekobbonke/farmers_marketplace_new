// components/CartButton.tsx
"use client";

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';

export default function CartButton() {
  const { totalItems } = useCart();
  
  return (
    <Link href="/cart" className="relative">
      <div className="p-2 hover:bg-slate-100 rounded-full transition-colors">
        <ShoppingCart size={24} strokeWidth={2} />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </div>
    </Link>
  );
}