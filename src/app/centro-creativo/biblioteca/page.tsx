'use client';

import React from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import dynamic from 'next/dynamic';

const BibliotecaTab = dynamic(() => import('@/components/creativo/BibliotecaTab').then(m => ({ default: m.BibliotecaTab })), { ssr: false });

export default function BibliotecaPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId } = useProduct();
    if (!storeId || !productId || productId === 'GLOBAL') return null;
    return <BibliotecaTab storeId={storeId} productId={productId} />;
}
