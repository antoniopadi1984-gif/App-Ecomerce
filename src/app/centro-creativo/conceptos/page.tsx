'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import dynamic from 'next/dynamic';

const ConceptosTab = dynamic(() => import('@/components/creativo/ConceptosTab').then(m => ({ default: m.ConceptosTab })), { ssr: false });

export default function ConceptosPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId } = useProduct();
    const [marketLang, setMarketLang] = useState('ES');

    useEffect(() => {
        if (!productId || productId === 'GLOBAL') { setMarketLang('ES'); return; }
        fetch(`/api/products/${productId}`)
            .then(r => r.json())
            .then(d => setMarketLang(d.product?.marketLanguage ?? 'ES'))
            .catch(() => { });
    }, [productId]);

    if (!storeId || !productId || productId === 'GLOBAL') return null;

    return <ConceptosTab storeId={storeId} productId={productId} marketLang={marketLang} />;
}
