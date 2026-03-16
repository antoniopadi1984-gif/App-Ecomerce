'use client';

import { AgentPanel } from "@/components/AgentPanel";
import React from 'react';
import { useStore } from '@/lib/store/store-context';
import { useProduct } from '@/context/ProductContext';
import dynamic from 'next/dynamic';

const DisenoTab = dynamic(() => import('@/components/creativo/DisenoTab').then(m => ({ default: m.DisenoTab })), { ssr: false });

export default function DisenoPage() {
    const { activeStoreId: storeId } = useStore();
    const { productId } = useProduct();

    if (!storeId || !productId || productId === 'GLOBAL') return null;

    return (
        <>
            <DisenoTab storeId={storeId} productId={productId} />
            <AgentPanel specialistRole="image-director" specialistLabel="Image Director" accentColor="#8B5CF6" storeId={storeId} productId={productId} moduleContext={{}} specialistActions={[{label:"Prompt packaging",prompt:"Genera un prompt para crear el packaging del producto"},{label:"Static ad C1",prompt:"Crea un static ad para concepto C1 en formato 4:5"},{label:"Carrusel ventas",prompt:"Diseña la estructura de un carrusel de ventas para Meta"}]} />
        </>
    );
}
