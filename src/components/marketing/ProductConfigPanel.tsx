"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    DollarSign,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Package,
    Image,
    Video,
    Link2,
    Calculator
} from "lucide-react";
import {
    calculateProductEconomicsAction,
    getProductEconomicsDashboardAction,
    updateProductPricingAction,
    createPricingOfferAction,
    type BreakevenMetrics
} from "@/app/marketing/economics/actions";
import {
    updateProductInfoAction,
    getProductInfoAction
} from "@/app/marketing/product-content/actions";

interface ProductConfigPanelProps {
    productId: string;
}

export default function ProductConfigPanel({ productId }: ProductConfigPanelProps) {
    const [activeTab, setActiveTab] = useState("economics");
    const [loading, setLoading] = useState(false);
    const [productData, setProductData] = useState<any>(null);
    const [breakeven, setBreakeven] = useState<any>(null);

    useEffect(() => {
        loadProductData();
    }, [productId]);

    async function loadProductData() {
        setLoading(true);
        try {
            const [economicsData, productInfo] = await Promise.all([
                getProductEconomicsDashboardAction(productId),
                getProductInfoAction(productId)
            ]);

            if (economicsData.success) {
                setBreakeven(economicsData.breakeven);
            }

            if (productInfo.success) {
                setProductData(productInfo.data);
            }
        } catch (error) {
            console.error("Error loading product data:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="economics" className="flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Economics
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Pricing
                    </TabsTrigger>
                    <TabsTrigger value="images" className="flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Images
                    </TabsTrigger>
                    <TabsTrigger value="videos" className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Videos
                    </TabsTrigger>
                    <TabsTrigger value="links" className="flex items-center gap-2">
                        <Link2 className="w-4 h-4" />
                        Links
                    </TabsTrigger>
                </TabsList>

                {/* ECONOMICS TAB */}
                <TabsContent value="economics" className="space-y-4">
                    <EconomicsTab
                        productId={productId}
                        breakeven={breakeven}
                        onRecalculate={loadProductData}
                    />
                </TabsContent>

                {/* PRICING TAB */}
                <TabsContent value="pricing" className="space-y-4">
                    <PricingTab productId={productId} productData={productData} />
                </TabsContent>

                {/* IMAGES TAB */}
                <TabsContent value="images" className="space-y-4">
                    <ImagesTab productId={productId} productData={productData} />
                </TabsContent>

                {/* VIDEOS TAB */}
                <TabsContent value="videos" className="space-y-4">
                    <VideosTab productId={productId} />
                </TabsContent>

                {/* LINKS TAB */}
                <TabsContent value="links" className="space-y-4">
                    <LinksTab productId={productId} productData={productData} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Economics Tab Component
function EconomicsTab({ productId, breakeven, onRecalculate }: any) {
    if (!breakeven) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <Button onClick={onRecalculate}>Calculate Economics</Button>
                </CardContent>
            </Card>
        );
    }

    const status = breakeven.grossMarginPercent > 30 ? 'healthy' :
        breakeven.grossMarginPercent > 20 ? 'warning' : 'critical';

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Breakeven ROAS */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        ROAS Breakeven
                    </CardTitle>
                    <CardDescription>ROAS mínimo para profit</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-blue-600">
                        {breakeven.breakevenROAS.toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Necesitas ROAS &gt; {breakeven.breakevenROAS.toFixed(2)} para ser profitable
                    </p>
                </CardContent>
            </Card>

            {/* Breakeven CPC */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        CPC Máximo
                    </CardTitle>
                    <CardDescription>CPC breakeven</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-green-600">
                        €{breakeven.breakevenCPC.toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        No pagues más de €{breakeven.breakevenCPC.toFixed(2)} por click
                    </p>
                </CardContent>
            </Card>

            {/* Margin Status */}
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Margin Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span>Total Cost:</span>
                            <span className="font-semibold">€{breakeven.totalCostWithVAT.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Gross Margin:</span>
                            <Badge variant={status === 'healthy' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}>
                                {breakeven.grossMarginPercent.toFixed(1)}%
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Clicks Needed (CR 2%):</span>
                            <span className="font-semibold">{breakeven.clicksNeeded}</span>
                        </div>
                    </div>

                    {status === 'critical' && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Margen crítico! Considera aumentar precio o reducir costos
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Pricing Tab Component
function PricingTab({ productId, productData }: any) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Pricing Configuration</CardTitle>
                    <CardDescription>Configure precios actuales y deseados</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <Label>Precio Actual</Label>
                            <Input type="number" step="0.01" defaultValue={productData?.price} />
                        </div>
                        <div>
                            <Label>Precio Deseado</Label>
                            <Input type="number" step="0.01" defaultValue={productData?.desiredPrice} />
                        </div>
                        <div>
                            <Label>Precio Original</Label>
                            <Input type="number" step="0.01" placeholder="Para mostrar descuento" />
                        </div>
                    </div>
                    <Button className="mt-4">Save Pricing</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Pricing Offers</CardTitle>
                    <CardDescription>Bundles y ofertas para aumentar AOV</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Create bundles here</p>
                </CardContent>
            </Card>
        </div>
    );
}

// Images Tab Component
function ImagesTab({ productId, productData }: any) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>Upload y gestiona imágenes optimizadas</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <Button variant="outline">Upload Image</Button>
                    <p className="text-sm text-muted-foreground">
                        {productData?.productImages?.length || 0} images uploaded
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

// Videos Tab Component
function VideosTab({ productId }: any) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Product Videos</CardTitle>
                <CardDescription>Upload y procesa videos</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline">Upload Video</Button>
            </CardContent>
        </Card>
    );
}

// Links Tab Component
function LinksTab({ productId, productData }: any) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Landing Pages</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {productData?.landingUrls?.map((url: string, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                                <Link2 className="w-4 h-4" />
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {url}
                                </a>
                            </div>
                        ))}
                        <Button variant="outline" size="sm">Add Landing</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Amazon Links</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {productData?.amazonLinks?.map((url: string, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
                                    {url}
                                </a>
                            </div>
                        ))}
                        <Button variant="outline" size="sm">Add Amazon Link</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
