"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle, Plus, Sparkles, Loader2, Trash2, Video, Image as ImageIcon, Globe, User } from "lucide-react";
import { toast } from "sonner";
import { createAvatar, getAvatarProfiles, deleteAvatarProfile } from "./actions";

export default function AvatarLab({ storeId }: { storeId: string }) {
    const [avatars, setAvatars] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({ name: '', sex: 'FEMALE', ageRange: '25-35', region: 'España' });

    useEffect(() => {
        loadAvatars();
    }, [storeId]);

    const loadAvatars = async () => {
        try {
            const data = await getAvatarProfiles(storeId);
            setAvatars(data);
        } catch (e) {
            toast.error("Error al cargar avatares");
        }
    };

    const handleCreate = async () => {
        if (!formData.name) return;
        setLoading(true);
        try {
            await createAvatar(storeId, formData);
            toast.success("Avatar generado correctamente");
            setIsAdding(false);
            loadAvatars();
        } catch (e: any) {
            toast.error(e.message || "Error al crear");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <UserCircle className="w-6 h-6 text-rose-600" /> AVATAR OS
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Crea la cara de tu marca: Avatares realistas y talking-heads (Mac M3).</p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold">
                        <Plus className="w-4 h-4 mr-2" /> NUEVO AVATAR
                    </Button>
                )}
            </header>

            {isAdding && (
                <Card className="rounded-[32px] border-rose-100 bg-rose-50/20 border-2 overflow-hidden shadow-xl">
                    <CardHeader className="bg-white border-b border-rose-50 p-6">
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Configurar Perfil de Avatar</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre del Avatar</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Sofía - SkinCare Expert"
                                    className="rounded-2xl border-slate-200 py-6"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Sexo</label>
                                <Select value={formData.sex} onValueChange={(v) => setFormData({ ...formData, sex: v })}>
                                    <SelectTrigger className="rounded-2xl border-slate-200 py-6 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FEMALE">Femenino</SelectItem>
                                        <SelectItem value="MALE">Masculino</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Rango de Edad</label>
                                <Input
                                    value={formData.ageRange}
                                    onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                                    placeholder="Ej: 25-35"
                                    className="rounded-2xl border-slate-200 py-6"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Región / Etnia</label>
                                <Input
                                    value={formData.region}
                                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                    placeholder="Ej: España / Latina"
                                    className="rounded-2xl border-slate-200 py-6"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleCreate}
                            disabled={loading || !formData.name}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-2xl py-8 font-black text-lg shadow-lg shadow-rose-200 transition-all"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Sparkles className="w-6 h-6 mr-2" />}
                            GENERAR AVATAR IA
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {avatars.length === 0 && !isAdding && (
                    <div className="col-span-full p-20 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
                        <p className="text-slate-400 font-medium italic">No hay avatares creados todavía.</p>
                    </div>
                )}

                {avatars.map((a) => (
                    <Card key={a.id} className="rounded-[40px] border-slate-200 overflow-hidden hover:shadow-2xl transition-all group bg-white shadow-sm">
                        <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden group">
                            {a.imageUrl ? (
                                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold italic">
                                    [ AVATAR IMAGE ]
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <User className="w-16 h-16" />
                                </div>
                            )}
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                                <Badge className="bg-white/90 backdrop-blur-sm text-slate-800 border-0 font-black text-[9px] uppercase tracking-tighter">
                                    {a.status}
                                </Badge>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all flex gap-2">
                                <Button size="sm" className="flex-1 bg-white hover:bg-slate-50 text-slate-900 font-black rounded-xl border-0 shadow-xl">
                                    <Video className="w-3.5 h-3.5 mr-1" /> TALKING HEAD
                                </Button>
                            </div>
                        </div>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">{a.name}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-[9px] font-bold text-slate-400 px-2 rounded-md">{a.sex}</Badge>
                                <Badge variant="outline" className="text-[9px] font-bold text-slate-400 px-2 rounded-md">{a.ageRange}</Badge>
                                <Badge variant="outline" className="text-[9px] font-bold text-slate-400 px-2 rounded-md">{a.region}</Badge>
                            </div>
                            <div className="flex justify-end mt-4 pt-4 border-t border-slate-50">
                                <Button variant="ghost" size="sm" onClick={() => deleteAvatarProfile(a.id).then(loadAvatars)} className="rounded-xl h-8 w-8 text-rose-500 hover:bg-rose-50 p-0">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
