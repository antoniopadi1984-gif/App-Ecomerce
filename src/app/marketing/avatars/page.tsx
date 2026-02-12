"use client";

import { useState, useEffect } from "react";
import { Plus, User, Sparkles, Image as ImageIcon, Trash2 } from "lucide-react";
import { createAvatarFromResearchAction, createCustomAvatarAction, getProductAvatarsAction, deleteAvatarAction, generateAvatarImageAction } from "../avatar/actions";

export default function AvatarsPage() {
    const [view, setView] = useState<'gallery' | 'create'>('gallery');
    const [mode, setMode] = useState<'research' | 'custom'>('research');
    const [avatars, setAvatars] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(''); // For gallery view product filter
    const [researchProductId, setResearchProductId] = useState(''); // For research-based creation

    // Custom avatar form
    const [customForm, setCustomForm] = useState({
        name: '',
        gender: 'female',
        age: 35,
        ethnicity: '',
        tone: 'friendly'
    });

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

    // Load avatars
    const loadAvatars = async (pid: string) => {
        if (!pid) return;
        const result = await getProductAvatarsAction(pid);
        if (result.success) {
            setAvatars(result.avatars || []);
        }
    };

    const handleCreateFromResearch = async () => {
        if (!researchProductId) {
            alert('Selecciona un producto primero');
            return;
        }

        setLoading(true);
        const result = await createAvatarFromResearchAction(researchProductId);
        setLoading(false);

        if (result.success) {
            alert(`✅ Avatar creado: ${result.avatar?.name}`);
            setView('gallery');
            loadAvatars(researchProductId); // Load avatars for the product it was created for
        } else {
            alert(`❌ Error: ${result.error}`);
        }
    };

    const handleCreateCustom = async () => {
        setLoading(true);
        // If in gallery view, selectedProduct might be set. Otherwise, it's null.
        const result = await createCustomAvatarAction(selectedProduct || null, customForm);
        setLoading(false);

        if (result.success) {
            alert(`✅ Avatar creado: ${result.avatar?.name}`);
            setView('gallery');
            if (selectedProduct) loadAvatars(selectedProduct);
        } else {
            alert(`❌ Error: ${result.error}`);
        }
    };

    const handleGenerateImage = async (avatarId: string) => {
        setLoading(true);
        const result = await generateAvatarImageAction(avatarId);
        setLoading(false);

        if (result.success) {
            alert('✅ Imagen generada (placeholder - integrar DALL-E)');
        } else {
            alert(`❌ Error: ${result.error}`);
        }
    };

    const handleDelete = async (avatarId: string) => {
        if (!confirm('¿Eliminar este avatar?')) return;

        const result = await deleteAvatarAction(avatarId);
        if (result.success) {
            if (selectedProduct) loadAvatars(selectedProduct);
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfcfd] p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Avatar Studio</h1>
                    <p className="text-gray-600 mt-1">Crea avatares realistas para tus videos</p>
                </div>
                <button
                    onClick={() => setView(view === 'gallery' ? 'create' : 'gallery')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    {view === 'gallery' ? (
                        <><Plus size={20} /> Nuevo Avatar</>
                    ) : (
                        <>← Galería</>
                    )}
                </button>
            </div>

            {view === 'gallery' ? (
                /* GALLERY VIEW */
                <div>
                    {/* Product Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Producto (para cargar avatares)
                        </label>
                        {loadingProducts ? (
                            <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500">
                                Cargando productos...
                            </div>
                        ) : (
                            <select
                                value={selectedProduct}
                                onChange={(e) => {
                                    setSelectedProduct(e.target.value);
                                    loadAvatars(e.target.value);
                                }}
                                className="px-4 py-2 border rounded-lg w-full max-w-md"
                            >
                                <option value="">-- Selecciona un producto --</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Avatars Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {avatars.map((avatar) => (
                            <div key={avatar.id} className="bg-white rounded-xl shadow-sm border p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                            {avatar.imageUrl ? (
                                                <img src={avatar.imageUrl} alt={avatar.name} className="w-12 h-12 rounded-full object-cover" />
                                            ) : (
                                                <User size={24} className="text-indigo-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{avatar.name}</h3>
                                            <p className="text-xs text-gray-500">{avatar.type}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(avatar.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    {avatar.gender && <p>Género: {avatar.gender}</p>}
                                    {avatar.age && <p>Edad: {avatar.age}</p>}
                                </div>

                                <button
                                    onClick={() => handleGenerateImage(avatar.id)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50"
                                >
                                    <ImageIcon size={16} />
                                    Generar Imagen
                                </button>
                            </div>
                        ))}

                        {avatars.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                No hay avatares. Crea uno nuevo.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* CREATE VIEW */
                <div className="max-w-2xl mx-auto">
                    {/* Creation Type Selector */}
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => setMode('research')}
                            className={`flex-1 p-6 rounded-xl border-2 ${mode === 'research'
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Sparkles className={`mx-auto mb-3 ${mode === 'research' ? 'text-indigo-600' : 'text-gray-400'}`} size={32} />
                            <h3 className="font-semibold text-gray-900 mb-1">Desde Research</h3>
                            <p className="text-sm text-gray-600">Auto-genera del avatar top</p>
                        </button>

                        <button
                            onClick={() => setMode('custom')}
                            className={`flex-1 p-6 rounded-xl border-2 ${mode === 'custom'
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <User className={`mx-auto mb-3 ${mode === 'custom' ? 'text-indigo-600' : 'text-gray-400'}`} size={32} />
                            <h3 className="font-semibold text-gray-900 mb-1">Custom</h3>
                            <p className="text-sm text-gray-600">Configuración manual</p>
                        </button>
                    </div>

                    {mode === 'research' ? (
                        /* RESEARCH-BASED */
                        <div className="bg-white rounded-xl shadow-sm border p-8">
                            <h2 className="text-xl font-semibold mb-4">Crear desde Research</h2>

                            <div className="mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Producto
                                    </label>
                                    {loadingProducts ? (
                                        <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500">
                                            Cargando...
                                        </div>
                                    ) : (
                                        <select
                                            value={researchProductId}
                                            onChange={(e) => setResearchProductId(e.target.value)}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        >
                                            <option value="">-- Selecciona --</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-6">
                                Se auto-generará un avatar realista basado en el top avatar de tu research
                            </p>

                            <button
                                onClick={handleCreateFromResearch}
                                disabled={loading || !selectedProduct}
                                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Generando...' : '✨ Generar Avatar'}
                            </button>
                        </div>
                    ) : (
                        /* CUSTOM */
                        <div className="bg-white rounded-xl shadow-sm border p-8">
                            <h2 className="text-xl font-semibold mb-6">Configuración Custom</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                                    <input
                                        type="text"
                                        value={customForm.name}
                                        onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Género</label>
                                    <select
                                        value={customForm.gender}
                                        onChange={(e) => setCustomForm({ ...customForm, gender: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    >
                                        <option value="female">Mujer</option>
                                        <option value="male">Hombre</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Edad: {customForm.age}
                                    </label>
                                    <input
                                        type="range"
                                        min="20"
                                        max="60"
                                        value={customForm.age}
                                        onChange={(e) => setCustomForm({ ...customForm, age: parseInt(e.target.value) })}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Etnia</label>
                                    <input
                                        type="text"
                                        value={customForm.ethnicity}
                                        onChange={(e) => setCustomForm({ ...customForm, ethnicity: e.target.value })}
                                        placeholder="Ej: Caucásico, Latino, Asiático..."
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tono de Voz</label>
                                    <select
                                        value={customForm.tone}
                                        onChange={(e) => setCustomForm({ ...customForm, tone: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    >
                                        <option value="professional">Profesional</option>
                                        <option value="friendly">Amigable</option>
                                        <option value="energetic">Energético</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleCreateCustom}
                                disabled={loading || !customForm.name}
                                className="w-full mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {loading ? 'Creando...' : 'Crear Avatar'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
