"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
 Package, DollarSign, Link2, FileText, FolderOpen, Upload,
 Tag, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Zap,
 Globe, ArrowRight, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ActionResult {
 action: string;
 status: "OK" | "FAIL" | "STUB" | "PENDING";
 message: string;
 timestamp: string;
 data?: any;
}

const STATUS_STYLES: Record<string, { bg: string; icon: any; label: string }> = {
 OK: { bg: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2, label: "OK" },
 FAIL: { bg: "bg-red-100 text-red-800 border-red-200", icon: XCircle, label: "FAIL" },
 STUB: { bg: "bg-amber-100 text-amber-800 border-amber-200", icon: AlertTriangle, label: "STUB" },
 PENDING: { bg: "bg-gray-100 text-gray-600 border-gray-200", icon: Loader2, label: "..." },
};

export default function DiagnosticoPage() {
 const params = useParams();
 const productId = params.id as string;
 const [product, setProduct] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [results, setResults] = useState<ActionResult[]>([]);
 const [runningAction, setRunningAction] = useState<string | null>(null);

 const fetchProduct = async () => {
 setLoading(true);
 try {
 const res = await fetch(`/api/productos/${productId}/diagnostico`);
 if (res.ok) {
 const data = await res.json();
 setProduct(data);
 }
 }
catch (e) {
 console.error("Error:", e);
 }
 setLoading(false);
 };

 useEffect(() => {
 fetchProduct();
 }, [productId]);

 const runAction = async (action: string, data?: any) => {
 setRunningAction(action);
 try {
 const res = await fetch(`/api/productos/${productId}/diagnostico`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ action, data }),
 });
 const result = await res.json();
 setResults(prev => [
 {
 action,
 status: result.status || "OK",
 message: result.message || "Completado",
 timestamp: new Date().toISOString(),
 data: result,
 },
 ...prev,
 ]);
 }
catch (e: any) {
 setResults(prev => [
 {
 action,
 status: "FAIL",
 message: `Error: ${e.message}`,
 timestamp: new Date().toISOString(),
 },
 ...prev,
 ]);
 }
 setRunningAction(null);
 };

 if (loading) {
 return (
 <div className="p-8 flex items-center justify-center">
 <Loader2 className="w-6 h-6 animate-spin mr-2" />
 Cargando diagnóstico...
 </div>
 );
 }

 if (!product) {
 return (
 <div className="p-8 text-center">
 <XCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
 <p className="text-lg font-medium">Producto no encontrado</p>
 <p className="text-sm text-muted-foreground">ID: {productId}</p>
 </div>
 );
 }

 const connections = product.store?.connections || [];

 return (
 <div className="p-6 space-y-6 max-w-7xl mx-auto">
 {/* Header */}
 <div>
 <h1 className="text-2xl font-bold flex items-center gap-2">
 <Zap className="w-6 h-6 text-amber-500" />
 Diagnóstico de Producto
 </h1>
 <p className="text-sm text-muted-foreground mt-1">
 Validación end-to-end del producto y sus conexiones
 </p>
 </div>

 {/* Product Info Card */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-lg flex items-center gap-2">
 <Package className="w-5 h-5" />
 Datos del Producto (BD)
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div>
 <p className="text-xs text-muted-foreground">Título</p>
 <p className="font-medium text-sm">{product.title}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Handle</p>
 <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{product.handle || "—"}</code>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">PVP</p>
 <p className="font-bold text-emerald-600">{product.price?.toFixed(2)}€</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Coste Unitario</p>
 <p className="font-bold text-red-500">{product.unitCost?.toFixed(2) || "—"}€</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Proveedor</p>
 <p className="text-sm">{product.supplier?.name || "Sin proveedor"}</p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Estado</p>
 <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>
 {product.status}
 </Badge>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">Drive Folder</p>
 <code className="text-xs bg-muted px-1.5 py-0.5 rounded break-all">
 {product.driveFolderId || "No asignado"}
 </code>
 </div>
 <div>
 <p className="text-xs text-muted-foreground">ID</p>
 <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{product.id}</code>
 </div>
 </div>

 {product.finance && (
 <div className="mt-4 pt-4 border-t">
 <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
 <DollarSign className="w-3 h-3" /> ProductFinance
 </p>
 <div className="grid grid-cols-4 md:grid-cols-6 gap-3 text-xs">
 <div><span className="text-muted-foreground">Coste:</span> <b>{product.finance.unitCost}€</b></div>
 <div><span className="text-muted-foreground">PVP:</span> <b>{product.finance.sellingPrice}€</b></div>
 <div><span className="text-muted-foreground">Envío:</span> <b>{product.finance.shippingCost}€</b></div>
 <div><span className="text-muted-foreground">Devolución:</span> <b>{product.finance.returnCost}€</b></div>
 <div><span className="text-muted-foreground">Packaging:</span> <b>{product.finance.packagingCost}€</b></div>
 <div><span className="text-muted-foreground">COD Fee:</span> <b>{product.finance.codFee}€</b></div>
 </div>
 </div>
 )}

 {product.competitorLinks?.length > 0 && (
 <div className="mt-4 pt-4 border-t">
 <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
 <Link2 className="w-3 h-3" /> Competitor Links ({product.competitorLinks.length})
 </p>
 <div className="space-y-1">
 {product.competitorLinks.map((link: any) => (
 <div key={link.id}
className="flex items-center gap-2 text-xs">
 <Badge variant="outline" className="text-[10px]">{link.type}</Badge>
 <a href={link.url} target="_blank" className="text-primary hover:underline truncate max-w-xs">{link.url}</a>
 </div>
 ))}
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Connections Status */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-lg flex items-center gap-2">
 <Globe className="w-5 h-5" />
 Estado de Conexiones del Store
 </CardTitle>
 </CardHeader>
 <CardContent>
 {connections.length === 0 ? (
 <p className="text-sm text-muted-foreground">No hay conexiones configuradas.</p>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
 {connections.map((conn: any) => (
 <div
 key={conn.id}
 className={`p-3 rounded-lg border text-center ${conn.isActive
 ? "bg-emerald-50 border-emerald-200"
 : "bg-gray-50 border-gray-200"
 }`}
 >
 <p className="text-sm font-medium">{conn.provider}</p>
 <Badge
 variant={conn.isActive ? "default" : "secondary"}
 className="text-xs mt-1"
 >
 {conn.isActive ? "Activa" : "Inactiva"}
 </Badge>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 {/* Actions Panel */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-lg flex items-center gap-2">
 <Zap className="w-5 h-5 text-amber-500" />
 Acciones de Diagnóstico
 </CardTitle>
 <CardDescription>
 Cada acción se ejecuta y registra en AuditLog
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 {/* Action 1: Save Competitor Links */}
 <Button
 variant="outline"
 className="h-auto p-4 justify-start text-left"
 disabled={runningAction !== null}
 onClick={() =>
 runAction("SAVE_COMPETITOR_LINKS", {
 links: [
 { type: "AMAZON", url: "https://amazon.es/dp/TEST", notes: "Verificación Fase 0" },
 { type: "COMPETITOR", url: "https://competitor.test/product", notes: "Competidor diagnóstico" },
 { type: "ALIEXPRESS", url: "https://aliexpress.com/item/TEST.html", notes: "Fuente proveedor" },
 ],
 })
 }
 >
 <div className="flex items-start gap-3">
 <Link2 className="w-5 h-5 mt-0.5 text-blue-500" />
 <div>
 <p className="font-medium">Guardar Links Competidores</p>
 <p className="text-xs text-muted-foreground mt-0.5">
 CRUD real → Guarda 3 CompetitorLink en BD
 </p>
 </div>
 </div>
 </Button>

 {/* Action 2: Generate Nomenclature */}
 <Button
 variant="outline"
 className="h-auto p-4 justify-start text-left"
 disabled={runningAction !== null}
 onClick={() => runAction("GENERATE_NOMENCLATURE")}
 >
 <div className="flex items-start gap-3">
 <Tag className="w-5 h-5 mt-0.5 text-purple-500" />
 <div>
 <p className="font-medium">Generar Nomenclatura</p>
 <p className="text-xs text-muted-foreground mt-0.5">
 Genera NAD_C1_V1 basado en template del Store
 </p>
 </div>
 </div>
 </Button>

 {/* Action 3: Create Drive Folder */}
 <Button
 variant="outline"
 className="h-auto p-4 justify-start text-left"
 disabled={runningAction !== null}
 onClick={() => runAction("CREATE_DRIVE_FOLDER")}
 >
 <div className="flex items-start gap-3">
 <FolderOpen className="w-5 h-5 mt-0.5 text-amber-500" />
 <div>
 <p className="font-medium">Crear Carpeta Drive</p>
 <p className="text-xs text-muted-foreground mt-0.5">
 Real si hay token, STUB si no
 </p>
 </div>
 </div>
 </Button>

 {/* Action 4: Upload Asset */}
 <Button
 variant="outline"
 className="h-auto p-4 justify-start text-left"
 disabled={runningAction !== null}
 onClick={() => runAction("UPLOAD_ASSET")}
 >
 <div className="flex items-start gap-3">
 <Upload className="w-5 h-5 mt-0.5 text-emerald-500" />
 <div>
 <p className="font-medium">Subir Asset</p>
 <p className="text-xs text-muted-foreground mt-0.5">
 STUB inicial — visible en AuditLog
 </p>
 </div>
 </div>
 </Button>
 </div>
 </CardContent>
 </Card>

 {/* Results Log */}
 <Card>
 <CardHeader className="pb-3">
 <div className="flex items-center justify-between">
 <CardTitle className="text-lg flex items-center gap-2">
 <FileText className="w-5 h-5" />
 Resultados ({results.length})
 </CardTitle>
 {results.length > 0 && (
 <Button variant="ghost" size="sm" onClick={() => setResults([])}>
 Limpiar
 </Button>
 )}
 </div>
 </CardHeader>
 <CardContent>
 {results.length === 0 ? (
 <p className="text-sm text-muted-foreground text-center py-4">
 Ejecuta una acción para ver resultados aquí. Cada acción genera un registro en AuditLog.
 </p>
 ) : (
 <div className="space-y-2">
 {results.map((r, i) => {
 const style = STATUS_STYLES[r.status] || STATUS_STYLES.PENDING;
 const Icon = style.icon;
 return (
 <div
 key={i}
 className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg}`}
 >
 <Icon className="w-4 h-4 mt-0.5 shrink-0" />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="font-medium text-sm">{r.action}</span>
 <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
 </div>
 <p className="text-xs mt-0.5">{r.message}</p>
 <p className="text-[10px] text-muted-foreground mt-1">
 {new Date(r.timestamp).toLocaleTimeString("es-ES")}
 </p>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
