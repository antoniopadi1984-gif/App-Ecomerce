"use client";

import { useState, useEffect } from "react";
import { Sparkles, Image as ImageIcon, Download, Palette } from "lucide-react";
import { generateStaticAdsFromResearchAction, getProductCreativesAction } from "../static-ads/actions";
import { generateStaticConcepts } from "../static-ads/actions";

interface Template {
    id: string;
    name: string;
    category: string;
    funnelStage: string;
    previewUrl?: string;
}

export default function StaticAdsPage() {
    const [view, setView] = useState<'generator' | 'library'>('generator');
    const [productId, setProductId] = useState('');
    const [loading, setLoading] = useState(false);
    const [creatives, setCreatives] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    // Nano Banana style
    const [productName, setProductName] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [concepts, setConcepts] = useState<any[]>([]);

    // Load products on mount
    useEffect(() => {
        async function loadProducts() {
            try {
                const res = await fetch('/api/products');
                const data = await res.json();
                setProducts(data.products || []);
            } catch (error) {
                console.error('Error loading products:', error);
            } finally {
                setLoadingProducts(false);
            }
        }
        loadProducts();
    }, []);

    const loadCreatives = async (pid: string) => {
        const result = await getProductCreativesAction(pid);
        if (result.success) {
            setCreatives(result.creatives || []);
        }
    };

    const handleGenerateFromResearch = async () => {
        if (!productId) {
            alert('Ingresa un Product ID');
            return;
        }

        setLoading(true);
        const result = await generateStaticAdsFromResearchAction(productId, 5);
        setLoading(false);

        if (result.success) {
            alert(`✅ Generados ${result.ads?.length} ads!`);
            setView('library');
            loadCreatives(productId);
        } else {
            alert(`❌ Error: ${result.error}`);
        }
    };

    const handleGenerateNanoBanana = async () => {
        if (!productName || !targetAudience) {
            alert('Completa producto y audiencia');
            return;
        }

        setLoading(true);
        const result = await generateStaticConcepts(productName, targetAudience);
        setLoading(false);

        if (result.success) {
            setConcepts(result.concepts || []);
        } else {
            alert(`❌ Error: ${result.error}`);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg)] p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Static Ads Generator</h1>
                    <p className="text-gray-600 mt-1">Genera ads estáticos en segundos</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView('generator')}
                        className={`px-4 py-2 rounded-lg ${view === 'generator'
                            ? 'bg-rose-600 text-white'
                            : 'bg-white border text-gray-700'
                            }`}
                    >
                        Generator
                    </button>
                    <button
                        onClick={() => setView('library')}
                        className={`px-4 py-2 rounded-lg ${view === 'library'
                            ? 'bg-rose-600 text-white'
                            : 'bg-white border text-gray-700'
                            }`}
                    >
                        Library
                    </button>
                </div>
            </div>

            {view === 'generator' ? (
                /* GENERATOR VIEW */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Template-Based */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Palette className="text-rose-600" size={24} />
                            <h2 className="text-xl font-semibold">Template-Based</h2>
                        </div>

                        <p className="text-sm text-gray-600 mb-6">
                            Auto-genera ads desde research usando 20+ templates pre-diseñados
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Selecciona Producto
                                </label>
                                {loadingProducts ? (
                                    <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500">
                                        Cargando productos...
                                    </div>
                                ) : (
                                    <select
                                        value={productId}
                                        onChange={(e) => setProductId(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg bg-white"
                                    >
                                        <option value="">-- Selecciona un producto --</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="bg-rose-50 p-4 rounded-lg">
                                <p className="text-sm text-rose-900 font-medium mb-2">
                                    Se generarán 5 ads con:
                                </p>
                                <ul className="text-sm text-rose-700 space-y-1">
                                    <li>✓ Copy auto-poblado del research</li>
                                    <li>✓ Templates COLD/WARM/HOT</li>
                                    <li>✓ Variantes de color</li>
                                </ul>
                            </div>

                            <button
                                onClick={handleGenerateFromResearch}
                                disabled={loading || !productId}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
                            >
                                {loading ? 'Generando...' : (
                                    <>
                                        <Sparkles size={20} />
                                        Generar 5 Ads
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Nano Banana Style */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <ImageIcon className="text-pink-600" size={24} />
                            <h2 className="text-xl font-semibold">Nano Banana AI</h2>
                        </div>

                        <p className="text-sm text-gray-600 mb-6">
                            Genera conceptos creativos con IA (imagen + copy)
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Producto
                                </label>
                                <input
                                    type="text"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    placeholder="Ej: Crema Anti-Edad"
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Audiencia Target
                                </label>
                                <input
                                    type="text"
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value)}
                                    placeholder="Ej: Mujeres 35-50 años"
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>

                            <button
                                onClick={handleGenerateNanoBanana}
                                disabled={loading || !productName || !targetAudience}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                            >
                                {loading ? 'Generando...' : (
                                    <>
                                        <Sparkles size={20} />
                                        Generar Conceptos
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Concepts Display */}
                        {concepts.length > 0 && (
                            <div className="mt-6 space-y-4">
                                <h3 className="font-semibold text-gray-900">Conceptos Generados:</h3>
                                {concepts.map((concept, i) => (
                                    <div key={i} className="bg-gray-50 p-4 rounded-lg">
                                        <p className="font-semibold text-gray-900 mb-2">{concept.headline}</p>
                                        <p className="text-sm text-gray-600 mb-2">{concept.copy}</p>
                                        <p className="text-xs text-gray-500">Ángulo: {concept.angle}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* LIBRARY VIEW */
                <div>
                    {/* Product Selector */}
                    <div className="mb-6 bg-white rounded-xl shadow-sm border p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Product ID (para cargar library)
                        </label>
                        <input
                            type="text"
                            placeholder="Product ID"
                            value={productId}
                            onChange={(e) => {
                                setProductId(e.target.value);
                                if (e.target.value) loadCreatives(e.target.value);
                            }}
                            className="px-4 py-2 border rounded-lg w-full max-w-md"
                        />
                    </div>

                    {/* Creatives Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {creatives.map((creative) => (
                            <div key={creative.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                {/* Preview */}
                                <div className="aspect-[9/16] bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center">
                                    {creative.thumbnailUrl ? (
                                        <img src={creative.thumbnailUrl} alt={creative.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-6">
                                            <ImageIcon className="mx-auto mb-2 text-rose-400" size={48} />
                                            <p className="text-sm text-rose-600">{creative.dimensions}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2 truncate">{creative.title}</h3>

                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${creative.funnelStage === 'COLD' ? 'bg-blue-100 text-blue-700' :
                                            creative.funnelStage === 'WARM' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {creative.funnelStage}
                                        </span>
                                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                                            {creative.status}
                                        </span>
                                    </div>

                                    <p className="text-xs text-gray-500 mb-3">
                                        Creado: {new Date(creative.createdAt).toLocaleDateString()}
                                    </p>

                                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                        <Download size={16} />
                                        Descargar
                                    </button>
                                </div>
                            </div>
                        ))}

                        {creatives.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No hay creativos generados aún
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
