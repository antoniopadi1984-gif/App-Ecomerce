'use client';

import React from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import dynamic from 'next/dynamic';

const CompetenciaTab = dynamic(() => import('@/components/creativo/CompetenciaTab').then(m => ({ default: m.CompetenciaTab })), { ssr: false });

export default function CompetenciaPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId, product } = useProduct();

    if (!storeId || !productId || productId === 'GLOBAL') return null;

    return <CompetenciaTab storeId={storeId} productId={productId} productSku={product?.handle || 'PROD'} />;
}
