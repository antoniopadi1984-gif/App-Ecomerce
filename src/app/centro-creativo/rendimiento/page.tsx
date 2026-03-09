'use client';

import React from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import dynamic from 'next/dynamic';

const RendimientoTab = dynamic(() => import('@/components/creativo/RendimientoTab').then(m => ({ default: m.RendimientoTab })), { ssr: false });

export default function RendimientoPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId } = useProduct();

    if (!storeId || !productId || productId === 'GLOBAL') return null;

    return <RendimientoTab storeId={storeId} productId={productId} />;
}
