'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useProduct } from '@/context/ProductContext';
import { useStore } from '@/lib/store/store-context';
import { toast } from 'sonner';

// ── UI Components ──────────────────────────────────────────────

const labelStyle = {
    fontSize: "9px", fontWeight: 800, color: "#94a3b8",
    textTransform: "uppercase" as const, letterSpacing: "0.07em",
    margin: "0 0 3px"
}

function Label({ children }: { children: React.ReactNode }) {
    return <p style={{ ...labelStyle, color: "#64748b", marginBottom: "8px" }}>{children}</p>;
}

function Input({ label, value, onChange, type = "text", placeholder }: any) {
    return (
        <div>
            <p style={labelStyle}>{label}</p>
            <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: "100%", padding: "5px 9px", borderRadius: "6px",
                    border: "1px solid #e2e8f0", fontSize: "12px",
                    outline: "none", boxSizing: "border-box"
                }} />
        </div>
    );
}

function Select({ label, value, onChange, options }: any) {
    return (
        <div>
            <p style={labelStyle}>{label}</p>
            <select value={value} onChange={e => onChange(e.target.value)} style={{
                width: "100%", padding: "5px 9px", borderRadius: "6px",
                border: "1px solid #e2e8f0", fontSize: "12px",
                outline: "none", background: "white", boxSizing: "border-box"
            }}>
                {options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

function Metric({ label, value, color, borderRight }: { label: string, value: string, color: string, borderRight?: boolean }) {
    return (
        <div style={{ textAlign: "center", borderRight: borderRight ? "1px solid #e2e8f0" : "none" }}>
            <div style={{ fontSize: "13px", fontWeight: 900, color }}>{value}</div>
            <div style={{
                fontSize: "8px", fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "1px"
            }}>
                {label}
            </div>
        </div>
    );
}

function UrlInput({ label, value, onChange, onSaved, savedMsg }: any) {
    return (
        <div>
            <p style={labelStyle}>{label}</p>
            <div style={{ position: "relative" }}>
                <input
                    value={value || ""}
                    onChange={e => onChange(e.target.value)}
                    style={{
                        width: "100%", padding: "5px 9px",
                        paddingRight: onSaved ? "28px" : "10px",
                        borderRadius: "6px", fontSize: "11px",
                        border: onSaved ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                        background: onSaved ? "#f0fdf4" : "white",
                        outline: "none", boxSizing: "border-box"
                    }}
                />
                {onSaved && (
                    <span style={{
                        position: "absolute", right: "8px", top: "50%",
                        transform: "translateY(-50%)", fontSize: "11px"
                    }}>✅</span>
                )}
            </div>
            {onSaved && savedMsg && (
                <p style={{ fontSize: "9px", color: "#16a34a", margin: "2px 0 0", fontWeight: 600 }}>
                    {savedMsg}
                </p>
            )}
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────────
export function AddProductDialog({ showCreateModal, setShowCreateModal }: { showCreateModal: boolean, setShowCreateModal: (v: boolean) => void }) {
    const { refreshAllProducts, setProductId } = useProduct();
    const { activeStoreId } = useStore();
    const [importing, setImporting] = useState(false);
    const [imported, setImported] = useState(false);
    const [importedCount, setImportedCount] = useState(0);
    const [creating, setCreating] = useState(false);
    const imageRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        // IDENTIDAD
        nombre: "", sku: "", categoria: "salud", pais: "ES", imagen: null as File | null, imageUrl: "",
        urlProducto: "", urlAmazon: "", googleDocUrl: "",
        // FINANCIERO
        precioVenta: 0, costeProducto: 0, costeEnvio: 0,
        costeManipulacion: 0, costeDevolucion: 0,
        fulfillment: "beeping",
        tasaEntrega: 70, tasaEnvio: 95, tasaConversion: 2,
        // COMPETIDORES
        competidores: [] as any[]
    });

    const updateForm = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
    const updateComp = (i: number, key: string, value: any) => {
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
        const PV = form.precioVenta;
        const CP = form.costeProducto;
        const CE = form.costeEnvio;
        const CM = form.costeManipulacion;
        const CD = form.costeDevolucion;    // % tasa coste devolución
        const TE = form.tasaEntrega / 100;  // % pedidos ENTREGADOS sobre enviados
        const TEn = form.tasaEnvio / 100;    // % pedidos ENVIADOS sobre generados
        const TC = form.tasaConversion / 100;

        // Margen real (interno): descuenta costes y devolución proporcional
        //   CD * (1 - TE) = coste devolución esperado (pedidos no entregados)
        const margen = PV - CP - CE - CM - (CD * (1 - TE));

        // ROAS Breakeven: mínimo ROAS para no perder dinero
        const gasto = PV - margen;  // coste total efectivo por conversión
        const roasBR = gasto > 0 ? PV / gasto : 0;

        // CPA máximo (margen disponible para adquisición)
        const cpaMax = margen > 0 ? margen : 0;

        // CPC máximo (CPA × tasa de conversión del landing)
        const cpcMax = TC * cpaMax;

        // Coste real por pedido generado (incluye envio * TEn)
        const costeReal = CP + CE * TEn + CM + (CD * (1 - TE));

        // Beneficio neto por pedido generado
        const beneficioNeto = PV * TE * TEn - costeReal;

        return { margen, costeReal, beneficioNeto, roasBR, cpaMax, cpcMax };
    }, [form]);

    const handleGoogleDocImport = async () => {
        const url = form.googleDocUrl;
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
                let count = 0;
                if (data.nombre) { newForm.nombre = data.nombre; count++; }
                if (data.categoria) { newForm.categoria = data.categoria; count++; }
                if (data.pais) { newForm.pais = data.pais; count++; }
                if (data.precioVenta) { newForm.precioVenta = data.precioVenta; count++; }
                if (data.costeProducto) { newForm.costeProducto = data.costeProducto; count++; }
                if (data.costeEnvio) { newForm.costeEnvio = data.costeEnvio; count++; }
                if (data.tasaEntregaEsperada) { newForm.tasaEntrega = data.tasaEntregaEsperada; count++; }
                if (data.tasaConversionEsperada) { newForm.tasaConversion = data.tasaConversionEsperada; count++; }

                setForm(newForm);
                setImportedCount(count);
                setImported(true);
            }
        } catch {
            toast.error('Error importing Doc');
        } finally {
            setImporting(false);
        }
    };

    const onClose = () => setShowCreateModal(false);

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

            onClose();
            setCreating(false);
        } catch (e) {
            setCreating(false);
            toast.error("Error al crear el producto");
        }
    };

    const labelStyle = {
        fontSize: "10px", fontWeight: 700, color: "#64748b",
        textTransform: "uppercase", letterSpacing: "0.05em",
        display: "block", marginBottom: "4px"
    } as const;

    if (!showCreateModal) return null;

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center"
        }}>
            <div style={{
                background: "white", borderRadius: "14px",
                width: "680px", maxHeight: "88vh",
                display: "flex", flexDirection: "column",
                boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
                animation: "modalIn 0.18s ease"
            }}>

                {/* HEADER — compacto */}
                <div style={{
                    padding: "14px 20px", borderBottom: "1px solid #f1f5f9",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    flexShrink: 0
                }}>
                    <div>
                        <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                            Nuevo producto
                        </h2>
                        <p style={{ fontSize: "10px", color: "#94a3b8", margin: "1px 0 0" }}>
                            Empieza por Google Doc si tienes research previo — rellena todo solo
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: "#f1f5f9", border: "none", borderRadius: "6px",
                        width: "28px", height: "28px", cursor: "pointer",
                        color: "#64748b", fontSize: "14px", fontWeight: 700
                    }}>✕</button>
                </div>

                {/* BODY — scroll */}
                <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>

                    {/* ── GOOGLE DOC ── */}
                    <div style={{
                        padding: "8px 10px", background: "#faf5ff",
                        border: "1px solid #e9d5ff", borderRadius: "8px", marginBottom: "10px"
                    }}>
                        <p style={{
                            fontSize: "10px", fontWeight: 800, color: "#7c3aed",
                            margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em"
                        }}>
                            ⚡ Importar desde Google Doc — rellena todo automáticamente
                        </p>
                        <div style={{ position: "relative", display: "flex", gap: "6px", alignItems: "center" }}>
                            <span style={{ fontSize: "14px" }}>🔗</span>
                            <input
                                placeholder="Pega URL del Google Doc..."
                                value={form.googleDocUrl}
                                onChange={e => updateForm("googleDocUrl", e.target.value)}
                                onBlur={() => form.googleDocUrl && handleGoogleDocImport()}
                                style={{
                                    width: "100%", padding: "5px 9px", borderRadius: "7px",
                                    border: "1px solid #e9d5ff", fontSize: "12px",
                                    outline: "none", boxSizing: "border-box", background: "white"
                                }}
                            />
                            {importing && (
                                <span style={{
                                    position: "absolute", right: "10px", top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: "11px", color: "#7c3aed"
                                }}>🔄 Extrayendo...</span>
                            )}
                        </div>
                        {imported && (
                            <p style={{ fontSize: "10px", color: "#16a34a", margin: "5px 0 0", fontWeight: 600 }}>
                                ✅ {importedCount} campos rellenados automáticamente
                            </p>
                        )}
                    </div>

                    {/* ── IDENTIDAD + FINANCIERO en grid 3 col ── */}
                    <Label>Identidad</Label>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                        <Input label="Nombre *" value={form.nombre}
                            onChange={(v: string) => {
                                updateForm("nombre", v)
                                updateForm("sku", "PROD_" + v.toUpperCase().replace(/\s+/g, "_") + "_01")
                            }} />
                        <Input label="SKU" value={form.sku} onChange={(v: string) => updateForm("sku", v)} />
                        <Select label="País" value={form.pais} onChange={(v: string) => updateForm("pais", v)}
                            options={["ES", "MX", "CO", "UK", "US", "LATAM"]} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                        <Select label="Categoría" value={form.categoria} onChange={(v: string) => updateForm("categoria", v)}
                            options={["salud", "belleza", "hogar", "fitness", "nutrición", "otro"]} />
                        <Select label="Fulfillment" value={form.fulfillment} onChange={(v: string) => updateForm("fulfillment", v)}
                            options={["beeping", "dropea", "dropi", "manual"]} />
                    </div>

                    {/* Imagen + URLs en 3 col */}
                    <div style={{ display: "grid", gridTemplateColumns: "72px 1fr 1fr", gap: "6px", marginBottom: "10px", alignItems: "center" }}>
                        {/* Imagen compacta */}
                        <div>
                            <p style={labelStyle}>Imagen</p>
                            <div
                                onClick={() => imageRef.current?.click()}
                                style={{
                                    width: "72px", height: "72px", border: "2px dashed #e2e8f0",
                                    borderRadius: "8px", display: "flex", alignItems: "center",
                                    justifyContent: "center", cursor: "pointer", background: "#f8fafc",
                                    overflow: "hidden"
                                }}
                            >
                                {form.imagen
                                    ? <img src={URL.createObjectURL(form.imagen)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Product Preview" />
                                    : <span style={{ fontSize: "20px" }}>📷</span>
                                }
                            </div>
                            <input ref={imageRef} type="file" accept="image/*"
                                style={{ display: "none" }} onChange={e => e.target.files && updateForm("imagen", e.target.files[0])} />
                        </div>
                        <Input label="URL producto / competidor" value={form.urlProducto}
                            onChange={(v: string) => updateForm("urlProducto", v)} />
                        <Input label="URL Amazon similar" value={form.urlAmazon}
                            onChange={(v: string) => updateForm("urlAmazon", v)} />
                    </div>

                    {/* ── FINANCIERO ── */}
                    <Label>Financiero</Label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "6px" }}>
                        <Input label="Precio venta €" type="number" value={form.precioVenta || ""} onChange={(v: string) => updateForm("precioVenta", +v)} placeholder="0.00" />
                        <Input label="Coste producto €" type="number" value={form.costeProducto || ""} onChange={(v: string) => updateForm("costeProducto", +v)} placeholder="0.00" />
                        <Input label="Coste envío €" type="number" value={form.costeEnvio || ""} onChange={(v: string) => updateForm("costeEnvio", +v)} placeholder="0.00" />
                        <Input label="Coste manip. €" type="number" value={form.costeManipulacion || ""} onChange={(v: string) => updateForm("costeManipulacion", +v)} placeholder="0.00" />
                        <Input label="Coste devol. %" type="number" value={form.costeDevolucion || ""} onChange={(v: string) => updateForm("costeDevolucion", +v)} placeholder="0.00" />
                        <Input label="Tasa entrega %" type="number" value={form.tasaEntrega || ""} onChange={(v: string) => updateForm("tasaEntrega", +v)} placeholder="70" />
                        <Input label="Tasa envío %" type="number" value={form.tasaEnvio || ""} onChange={(v: string) => updateForm("tasaEnvio", +v)} placeholder="95" />
                        <Input label="Tasa convers. %" type="number" value={form.tasaConversion || ""} onChange={(v: string) => updateForm("tasaConversion", +v)} placeholder="2" />
                    </div>

                    {/* Métricas calculadas — fila compacta */}
                    <div style={{
                        display: "grid", gridTemplateColumns: "repeat(6, 1fr)",
                        gap: "6px", padding: "8px 10px",
                        background: metricas.roasBR > 2.5 ? "#f0fdf4" : metricas.roasBR >= 1.5 ? "#fffbeb" : metricas.roasBR > 0 ? "#fef2f2" : "#f8fafc",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0", marginBottom: "10px"
                    }}>
                        <Metric label="ROAS BR" value={metricas.roasBR.toFixed(1) + "x"}
                            color={metricas.roasBR < 1.5 ? "#ef4444" : metricas.roasBR < 2.5 ? "#f59e0b" : "#16a34a"} borderRight />
                        <Metric label="CPA Máx" value={"€" + metricas.cpaMax.toFixed(0)} color="#3b82f6" borderRight />
                        <Metric label="CPC Máx" value={"€" + metricas.cpcMax.toFixed(2)} color="#8b5cf6" borderRight />
                        <Metric label="Margen" value={"€" + metricas.margen.toFixed(0)} color="#64748b" borderRight />
                        <Metric label="Benef. neto" value={"€" + metricas.beneficioNeto.toFixed(0)} color="#64748b" borderRight />
                        <Metric label="Coste real" value={"€" + metricas.costeReal.toFixed(0)} color="#64748b" />
                    </div>

                    {/* ── COMPETIDORES ── */}
                    <Label>Competidores</Label>

                    {form.competidores.map((comp, i) => (
                        <div key={i} style={{
                            padding: "8px 10px", border: "1px solid #e2e8f0",
                            borderRadius: "8px", marginBottom: "6px", position: "relative",
                            background: "#fafafa"
                        }}>
                            <button onClick={() => removeCompetidor(i)} style={{
                                position: "absolute", top: "8px", right: "8px",
                                background: "none", border: "none", color: "#cbd5e1",
                                cursor: "pointer", fontSize: "13px", lineHeight: 1
                            }}>✕</button>

                            {/* Fila 1: nombre + precio */}
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "6px", marginBottom: "6px" }}>
                                <Input label="Nombre" value={comp.nombre} onChange={(v: string) => updateComp(i, "nombre", v)} />
                                <Input label="Precio €" type="number" value={comp.precioVenta} onChange={(v: string) => updateComp(i, "precioVenta", +v)} />
                            </div>

                            {/* Fila 2: URLs con feedback */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                                <UrlInput label="URL web" value={comp.urlWeb}
                                    onChange={(v: string) => updateComp(i, "urlWeb", v)}
                                    onSaved={comp.urlWeb?.length > 5} />
                                <UrlInput label="URL Amazon" value={comp.urlAmazon}
                                    onChange={(v: string) => updateComp(i, "urlAmazon", v)}
                                    onSaved={comp.urlAmazon?.length > 5} />
                            </div>

                            {/* Fila 3: bibliotecas de anuncios con feedback especial */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                                <UrlInput label="Meta Ads Library" value={comp.urlMetaLibrary}
                                    onChange={(v: string) => updateComp(i, "urlMetaLibrary", v)}
                                    onSaved={comp.urlMetaLibrary?.length > 5}
                                    savedMsg="✅ Se importarán anuncios" />
                                <UrlInput label="TikTok Ads Library" value={comp.urlTikTokLibrary}
                                    onChange={(v: string) => updateComp(i, "urlTikTokLibrary", v)}
                                    onSaved={comp.urlTikTokLibrary?.length > 5}
                                    savedMsg="✅ Se importarán anuncios" />
                            </div>
                        </div>
                    ))}

                    <button onClick={addCompetidor} style={{
                        width: "100%", padding: "6px", borderRadius: "6px",
                        border: "1px dashed #c4b5fd", background: "transparent",
                        color: "#7c3aed", fontSize: "11px", fontWeight: 700,
                        cursor: "pointer", marginTop: "4px"
                    }}>
                        + Añadir competidor
                    </button>
                </div>

                {/* FOOTER */}
                <div style={{
                    padding: "10px 20px", borderTop: "1px solid #f1f5f9",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    flexShrink: 0
                }}>
                    {/* Izquierda: cancelar + hint */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button onClick={onClose} style={{
                            padding: "7px 16px", borderRadius: "7px",
                            border: "1px solid #e2e8f0", background: "white",
                            color: "#64748b", fontSize: "12px", fontWeight: 600, cursor: "pointer"
                        }}>
                            Cancelar
                        </button>
                        {!form.nombre && (
                            <span style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 600 }}>
                                * Nombre obligatorio
                            </span>
                        )}
                    </div>

                    {/* Derecha: botón crear */}
                    <button
                        onClick={handleCrearProducto}
                        disabled={!form.nombre || creating}
                        style={{
                            padding: "7px 22px", borderRadius: "7px", border: "none",
                            background: form.nombre ? "#7c3aed" : "#e2e8f0",
                            color: form.nombre ? "white" : "#94a3b8",
                            fontSize: "12px", fontWeight: 700,
                            cursor: form.nombre ? "pointer" : "not-allowed",
                            transition: "all 0.2s ease"
                        }}
                    >
                        {creating ? "⏳ Creando..." : "Crear producto →"}
                    </button>
                </div>
            </div>
        </div>
    );
}
