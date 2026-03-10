'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { useProduct } from '@/context/ProductContext';
import dynamic from 'next/dynamic';

const AvataresIATab = dynamic(() => import('@/components/creativo/AvataresIATab').then(m => ({ default: m.AvataresIATab })), { ssr: false });

export default function AvataresIAPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId } = useProduct();
    if (!storeId || !productId || productId === 'GLOBAL') return null;
    return <AvataresIATab storeId={storeId} productId={productId} />;
}
