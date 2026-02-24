"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyLandingLabRedirect() {
 const router = useRouter();

 useEffect(() => {
 router.replace("/marketing");
 }, [router]);

 return (
 <div className="flex items-center justify-center min-h-screen bg-slate-50">
 <div className="animate-pulse flex flex-col items-center gap-4">
 <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Redirigiendo a Landing Lab Unificado...</p>
 </div>
 </div>
 );
}
