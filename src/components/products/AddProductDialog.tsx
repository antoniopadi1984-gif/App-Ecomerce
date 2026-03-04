'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useProduct } from '@/context/ProductContext';
import { useStore } from '@/lib/store/store-context';
import { toast } from 'sonner';

// Auxiliary components
function SectionTitle({ children }: { children: React.ReactNode }) {
    return <p style={{
        fontSize: "10px", fontWeight: 900, color: "#94a3b8",
        textTransform: "uppercase", letterSpacing: "0.08em",
        margin: "0 0 10px"
    }}>{children}</p>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Field({ label, value, onChange, type = "text", options, fullWidth }: any) {
    return (
        <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined, marginBottom: "4px" }}>
            <label style={{
                fontSize: "10px", fontWeight: 700, color: "#64748b",
                textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px"
            }}>
                {label}
            </label>
            {type === "select" ? (
                <select value={value} onChange={e => onChange(e.target.value)} style={{
                    width: "100%", padding: "7px 10px", borderRadius: "7px",
                    border: "1px solid #e2e8f0", fontSize: "12px", outline: "none",
                    background: "white"
                }}>
                    {options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                </select>
            ) : (
                <input type={type} value={value} onChange={e => onChange(e.target.value)}
                    style={{
                        width: "100%", padding: "7px 10px", borderRadius: "7px",
                        border: "1px solid #e2e8f0", fontSize: "12px", outline: "none",
                        boxSizing: "border-box"
                    }}
                />
            )}
        </div>
    );
}

function MetricBox({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div style={{ textAlign: "center", padding: "8px 4px" }}>
            <div style={{ fontSize: "15px", fontWeight: 900, color }}>{value}</div>
            <div style={{
                fontSize: "9px", fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px"
            }}>
                {label}
            </div>
        </div>
    );
}

// Main component
export function AddProductDialog({ showCreateModal, setShowCreateModal }: { showCreateModal: boolean, setShowCreateModal: (v: boolean) => void }) {
    const { refreshAllProducts, setProductId } = useProduct();
    const { activeStoreId } = useStore();
    const [step, setStep] = useState(1);
    const [importing, setImporting] = useState(false);
    const [imported, setImported] = useState(false);
    const [importedFields, setImportedFields] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Datos del formulario
    const [form, setForm] = useState({
        // IDENTIDAD
        nombre: "", sku: "", categoria: "salud", pais: "ES", imagen: null as File | null, imageUrl: "",
        urlProducto: "", urlAmazon: "", googleDocUrl: "",
        // FINANCIERO
        precioVenta: 0, costeProducto: 0, costeEnvio: 0,
        costeManipulacion: 0, costeDevolucion: 0,
        fulfillment: "beeping",
        tasaEntrega: 70, tasaConversion: 2,
        // COMPETIDORES
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        competidores: [] as any[],
        landingsIds: [] as string[]
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateForm = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateCompetidor = (i: number, key: string, value: any) => {
        const next = [...form.competidores];
        next[i][key] = value;
        updateForm("competidores", next);
    };
    const addCompetidor = () => {
        updateForm("competidores", [...form.competidores, { nombre: "", urlWeb: "", urlAmazon: "", urlMetaLibrary: "", urlTikTokLibrary: "", precioVenta: 0 }]);
    };
    const removeCompetidor = (i: number) => {
        const next = [...form.competidores];
        next.splice(i, 1);
        updateForm("competidores", next);
    };

    // Métricas calculadas en tiempo real
    const metricas = useMemo(() => {
        const { precioVenta, costeProducto, costeEnvio, costeManipulacion, costeDevolucion, tasaEntrega, tasaConversion } = form;
        const costeTotal = costeProducto + costeEnvio + costeManipulacion;
        const margenBruto = precioVenta - costeTotal;
        const tasaDevolucion = costeDevolucion > 0 ? costeDevolucion : 5; // Fallback a 5%? O usar el coste de devolución per se? 
        // El input se llama costeDevolucion, pero formula dice: costeReal = costeTotal + (tasaDevolucion / 100 * costeDevolucion)
        // La voy a tratar como "Tasa de Devolución %"
        const costeReal = costeTotal + (tasaDevolucion / 100 * costeTotal);
        const beneficioNeto = (tasaEntrega / 100 * precioVenta) - costeReal;
        const roasBR = beneficioNeto > 0 ? precioVenta / beneficioNeto : 0;
        const cpaMax = beneficioNeto > 0 ? beneficioNeto : 0;
        const cpcMax = (tasaConversion / 100) * cpaMax;
        return { margenBruto, costeReal, beneficioNeto, roasBR, cpaMax, cpcMax };
    }, [form]);

    const handleGoogleDocImport = async (url: string) => {
        if (!url || !url.includes('docs.google.com')) return;
        setImporting(true);
        setImported(false);
        try {
            const res = await fetch('/api/research/extract-doc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, storeId: activeStoreId })
            });
            const { data, success } = await res.json();
            if (success && data) {
                const newForm = { ...form };
                const fieldsFilled: string[] = [];
                if (data.nombre) { newForm.nombre = data.nombre; fieldsFilled.push('Nombre'); }
                if (data.categoria) { newForm.categoria = data.categoria; fieldsFilled.push('Categoría'); }
                if (data.pais) { newForm.pais = data.pais; fieldsFilled.push('País'); }
                if (data.precioVenta) { newForm.precioVenta = data.precioVenta; fieldsFilled.push('PVP'); }
                if (data.costeProducto) { newForm.costeProducto = data.costeProducto; fieldsFilled.push('Coste'); }
                if (data.costeEnvio) { newForm.costeEnvio = data.costeEnvio; fieldsFilled.push('Envío'); }
                if (data.tasaEntregaEsperada) { newForm.tasaEntrega = data.tasaEntregaEsperada; fieldsFilled.push('Entrega'); }
                if (data.tasaConversionEsperada) { newForm.tasaConversion = data.tasaConversionEsperada; fieldsFilled.push('CVR'); }

                setForm(newForm);
                setImportedFields(fieldsFilled);
                setImported(true);
            }
        } catch {
            toast.error('Error importing Doc');
        } finally {
            setImporting(false);
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        updateForm("imagen", file);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const d = await res.json();
            if (d.success) { updateForm("imageUrl", d.url); toast.success('Imagen subida'); }
        } catch { toast.error('Error de conexión'); }
    };

    const handleImageDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            updateForm("imagen", file);
        }
    };

    const handleCrearProducto = async () => {
        setCreating(true);
        try {
            const apiPayload = {
                title: form.nombre,
                sku: form.sku || ('PROD_' + form.nombre.toUpperCase().replace(/\s/g, "_") + "_01"),
                country: form.pais,
                niche: form.categoria,
                pvpEstimated: form.precioVenta,
                price: form.precioVenta,
                unitCost: form.costeProducto,
                shippingCost: form.costeEnvio,
                handlingCost: form.costeManipulacion,
                returnRate: form.costeDevolucion,
                fulfillment: form.fulfillment,
                deliveryRate: form.tasaEntrega,
                cvrExpected: form.tasaConversion,
                cpaMax: metricas.cpaMax,
                breakevenCPC: metricas.cpcMax,
                breakevenROAS: metricas.roasBR,
                imageUrl: form.imageUrl,
                googleDocUrl: form.googleDocUrl,
                competitors: form.competidores,
            };

            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Store-Id": activeStoreId || '' },
                body: JSON.stringify(apiPayload)
            });
            const data = await res.json();

            if (!data.success) throw new Error(data.error);

            await refreshAllProducts();
            setProductId(data.product.id);

            setShowCreateModal(false);
            setCreating(false);
        } catch (e) {
            setCreating(false);
            toast.error("Error al crear el producto");
        }
    };

    if (!showCreateModal) return null;

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center"
        }}>
            <div style={{
                background: "white", borderRadius: "16px",
                width: "600px", maxHeight: "90vh",
                display: "flex", flexDirection: "column",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
            }}>

                {/* HEADER FIJO */}
                <div style={{
                    padding: "20px 24px 16px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    flexShrink: 0
                }}>
                    <div>
                        <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                            Nuevo producto
                        </h2>
                        <p style={{ fontSize: "11px", color: "#94a3b8", margin: "2px 0 0" }}>
                            Paso {step} de 2
                        </p>
                    </div>
                    <button onClick={() => setShowCreateModal(false)} style={{
                        background: "none", border: "none", fontSize: "18px",
                        color: "#94a3b8", cursor: "pointer", padding: "4px"
                    }}>✕</button>
                </div>

                {/* PROGRESS BAR */}
                <div style={{ height: "3px", background: "#f1f5f9", flexShrink: 0 }}>
                    <div style={{
                        height: "100%", background: "#7c3aed",
                        width: step === 1 ? "50%" : "100%",
                        transition: "width 0.3s ease"
                    }} />
                </div>

                {/* BODY — scroll */}
                <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
                    {step === 1 && (
                        <>
                            {/* GOOGLE DOC */}
                            <div style={{
                                padding: "12px 14px", background: "#faf5ff",
                                border: "1px solid #e9d5ff", borderRadius: "10px", marginBottom: "20px"
                            }}>
                                <p style={{
                                    fontSize: "11px", fontWeight: 700, color: "#7c3aed",
                                    margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em"
                                }}>
                                    ⚡ Importar desde Google Doc
                                </p>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <input
                                        placeholder="Pega URL del Google Doc con research previo..."
                                        value={form.googleDocUrl}
                                        onChange={e => updateForm("googleDocUrl", e.target.value)}
                                        onBlur={() => form.googleDocUrl && handleGoogleDocImport(form.googleDocUrl)}
                                        style={{
                                            flex: 1, padding: "7px 10px", borderRadius: "7px",
                                            border: "1px solid #e9d5ff", fontSize: "12px", outline: "none"
                                        }}
                                    />
                                    {importing && <span style={{ fontSize: "11px", color: "#7c3aed", alignSelf: "center" }}>🔄</span>}
                                </div>
                                {imported && (
                                    <p style={{ fontSize: "11px", color: "#16a34a", margin: "6px 0 0" }}>
                                        ✅ Rellenados automáticamente: {importedFields.join(", ")}
                                    </p>
                                )}
                            </div>

                            {/* IDENTIDAD */}
                            <SectionTitle>Identidad</SectionTitle>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                                <Field label="Nombre *" value={form.nombre}
                                    onChange={(v: string) => { updateForm("nombre", v); updateForm("sku", "PROD_" + v.toUpperCase().replace(/\s/g, "_") + "_01"); }} />
                                <Field label="SKU" value={form.sku} onChange={(v: string) => updateForm("sku", v)} />
                                <Field label="Categoría" type="select"
                                    options={["salud", "belleza", "hogar", "fitness", "nutrición", "otro"]}
                                    value={form.categoria} onChange={(v: string) => updateForm("categoria", v)} />
                                <Field label="País" type="select"
                                    options={["ES", "MX", "CO", "UK", "US", "LATAM"]}
                                    value={form.pais} onChange={(v: string) => updateForm("pais", v)} />
                            </div>

                            <Field label="URL producto / competidor" value={form.urlProducto}
                                onChange={(v: string) => updateForm("urlProducto", v)} fullWidth />
                            <Field label="URL Amazon similar" value={form.urlAmazon}
                                onChange={(v: string) => updateForm("urlAmazon", v)} fullWidth />

                            {/* Imagen upload */}
                            <div style={{ marginTop: "10px", marginBottom: "20px" }}>
                                <label style={{
                                    fontSize: "11px", fontWeight: 700, color: "#64748b",
                                    textTransform: "uppercase", letterSpacing: "0.05em"
                                }}>
                                    Imagen del producto
                                </label>
                                <div
                                    onDrop={handleImageDrop}
                                    onDragOver={e => e.preventDefault()}
                                    style={{
                                        marginTop: "6px", border: "2px dashed #e2e8f0",
                                        borderRadius: "10px", padding: "20px", textAlign: "center",
                                        cursor: "pointer", background: "#f8fafc"
                                    }}
                                    onClick={() => imageInputRef.current?.click()}
                                >
                                    {form.imagen
                                        ? <img src={URL.createObjectURL(form.imagen)} alt="Preview" style={{ height: "60px", objectFit: "contain", margin: "0 auto" }} />
                                        : <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                                            Arrastra imagen o haz click
                                        </p>
                                    }
                                </div>
                                <input ref={imageInputRef} type="file" accept="image/*"
                                    style={{ display: "none" }} onChange={handleImageSelect} />
                            </div>

                            {/* FINANCIERO */}
                            <SectionTitle>Financiero</SectionTitle>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <Field label="Precio venta € *" type="number" value={form.precioVenta}
                                    onChange={(v: string) => updateForm("precioVenta", parseFloat(v) || 0)} />
                                <Field label="Coste producto €" type="number" value={form.costeProducto}
                                    onChange={(v: string) => updateForm("costeProducto", parseFloat(v) || 0)} />
                                <Field label="Coste envío €" type="number" value={form.costeEnvio}
                                    onChange={(v: string) => updateForm("costeEnvio", parseFloat(v) || 0)} />
                                <Field label="Coste manipulación €" type="number" value={form.costeManipulacion}
                                    onChange={(v: string) => updateForm("costeManipulacion", parseFloat(v) || 0)} />
                                <Field label="Coste devolución €" type="number" value={form.costeDevolucion}
                                    onChange={(v: string) => updateForm("costeDevolucion", parseFloat(v) || 0)} />
                                <Field label="Fulfillment" type="select"
                                    options={["beeping", "dropea", "dropi", "manual"]}
                                    value={form.fulfillment} onChange={(v: string) => updateForm("fulfillment", v)} />
                                <Field label="Tasa entrega % (def. 70)" type="number" value={form.tasaEntrega}
                                    onChange={(v: string) => updateForm("tasaEntrega", parseFloat(v) || 70)} />
                                <Field label="Tasa conversión % (def. 2)" type="number" value={form.tasaConversion}
                                    onChange={(v: string) => updateForm("tasaConversion", parseFloat(v) || 2)} />
                            </div>

                            {/* MÉTRICAS EN TIEMPO REAL */}
                            <div style={{
                                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                                gap: "8px", marginTop: "14px",
                                padding: "12px", background: "#f8fafc",
                                borderRadius: "10px", border: "1px solid #e2e8f0"
                            }}>
                                <MetricBox label="ROAS BR" value={metricas.roasBR.toFixed(2) + "x"}
                                    color={metricas.roasBR < 2 ? "#ef4444" : metricas.roasBR < 3 ? "#f59e0b" : "#16a34a"} />
                                <MetricBox label="CPA Máx" value={"€" + metricas.cpaMax.toFixed(2)} color="#3b82f6" />
                                <MetricBox label="CPC Máx" value={"€" + metricas.cpcMax.toFixed(2)} color="#8b5cf6" />
                                <MetricBox label="Margen bruto" value={"€" + metricas.margenBruto.toFixed(2)} color="#64748b" />
                                <MetricBox label="Beneficio neto" value={"€" + metricas.beneficioNeto.toFixed(2)} color="#64748b" />
                                <MetricBox label="Coste real/ud" value={"€" + metricas.costeReal.toFixed(2)} color="#64748b" />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {/* COMPETIDORES */}
                            <SectionTitle>Competidores</SectionTitle>

                            {form.competidores.map((comp, i) => (
                                <div key={i} style={{
                                    padding: "12px", border: "1px solid #e2e8f0",
                                    borderRadius: "10px", marginBottom: "10px", position: "relative"
                                }}>
                                    <button onClick={() => removeCompetidor(i)} style={{
                                        position: "absolute", top: "8px", right: "8px",
                                        background: "none", border: "none", color: "#94a3b8",
                                        cursor: "pointer", fontSize: "14px"
                                    }}>✕</button>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                        <Field label="Nombre" value={comp.nombre}
                                            onChange={(v: string) => updateCompetidor(i, "nombre", v)} />
                                        <Field label="Precio venta €" type="number" value={comp.precioVenta}
                                            onChange={(v: string) => updateCompetidor(i, "precioVenta", parseFloat(v) || 0)} />
                                        <Field label="URL web" value={comp.urlWeb}
                                            onChange={(v: string) => updateCompetidor(i, "urlWeb", v)} />
                                        <Field label="URL Amazon" value={comp.urlAmazon}
                                            onChange={(v: string) => updateCompetidor(i, "urlAmazon", v)} />
                                        <Field label="Meta Ads Library URL" value={comp.urlMetaLibrary}
                                            onChange={(v: string) => updateCompetidor(i, "urlMetaLibrary", v)} />
                                        <Field label="TikTok Ads Library URL" value={comp.urlTikTokLibrary}
                                            onChange={(v: string) => updateCompetidor(i, "urlTikTokLibrary", v)} />
                                    </div>
                                </div>
                            ))}

                            <button onClick={addCompetidor} style={{
                                width: "100%", padding: "8px", borderRadius: "8px",
                                border: "1px dashed #c4b5fd", background: "#faf5ff",
                                color: "#7c3aed", fontSize: "12px", fontWeight: 700,
                                cursor: "pointer", marginBottom: "20px"
                            }}>
                                + Añadir competidor
                            </button>

                            {/* LANDINGS EXISTENTES */}
                            <SectionTitle>Landings existentes (opcional)</SectionTitle>
                            <div style={{
                                padding: "16px", border: "1px dashed #e2e8f0",
                                borderRadius: "10px", background: "#f8fafc", textAlign: "center"
                            }}>
                                <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>Podrás asignar landings después</p>
                            </div>
                        </>
                    )}
                </div>

                {/* FOOTER FIJO */}
                <div style={{
                    padding: "16px 24px",
                    borderTop: "1px solid #f1f5f9",
                    display: "flex", justifyContent: "space-between",
                    flexShrink: 0
                }}>
                    <button
                        onClick={() => step === 1 ? setShowCreateModal(false) : setStep(1)}
                        style={{
                            padding: "8px 20px", borderRadius: "8px",
                            border: "1px solid #e2e8f0", background: "white",
                            color: "#64748b", fontSize: "13px", fontWeight: 600, cursor: "pointer"
                        }}
                    >
                        {step === 1 ? "Cancelar" : "← Atrás"}
                    </button>

                    <button
                        onClick={() => step === 1 ? setStep(2) : handleCrearProducto()}
                        disabled={!form.nombre || !form.precioVenta || creating}
                        style={{
                            padding: "8px 24px", borderRadius: "8px", border: "none",
                            background: form.nombre && form.precioVenta ? "#7c3aed" : "#e2e8f0",
                            color: form.nombre && form.precioVenta ? "white" : "#94a3b8",
                            fontSize: "13px", fontWeight: 700, cursor: form.nombre && form.precioVenta ? "pointer" : "not-allowed"
                        }}
                    >
                        {step === 1 ? "Siguiente →" : creating ? "Creando..." : "Crear producto"}
                    </button>
                </div>
            </div>
        </div>
    );
}
