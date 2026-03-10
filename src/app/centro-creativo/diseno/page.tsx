'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { useProduct } from '@/context/ProductContext';
import dynamic from 'next/dynamic';

const DisenoTab = dynamic(() => import('@/components/creativo/DisenoTab').then(m => ({ default: m.DisenoTab })), { ssr: false });

export default function DisenoPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId } = useProduct();

    if (!storeId || !productId || productId === 'GLOBAL') return null;

    return <DisenoTab storeId={storeId} productId={productId} />;
}
