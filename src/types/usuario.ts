/**
 * Domain types shared across the app
 * Single source of truth for user/gestor model
 */

export type UserRol = "admin" | "gestor" | "agente_ia" | "visor";
export type UserTipo = "humano" | "bot";
export type UserEstado = "activo" | "invitado" | "inactivo";

export interface Usuario {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: UserRol;
    tipo: UserTipo;
    estado: UserEstado;
    avatar?: string;        // URL foto (Cloudflare R2 / S3)
    color: string;          // color identificativo en la UI (#hex)
    createdAt: Date;
    invitadoPor?: string;   // id del usuario que lo invitó
}

/**
 * Gestor — subconjunto de Usuario usado en asignaciones de pedidos.
 * Se mapea desde Usuario al leer de DB.
 */
export interface Gestor {
    id: string;
    nombre: string;         // nombre + apellido corto: "María G."
    tipo: UserTipo;
    activo: boolean;        // estado === "activo"
    avatar?: string;
    color: string;
    emoji?: string;         // fallback visual si no hay avatar
}

/** Mapea un Usuario completo a un Gestor simplificado */
export function usuarioToGestor(u: Usuario): Gestor {
    return {
        id: u.id,
        nombre: `${u.nombre} ${u.apellido.charAt(0)}.`,
        tipo: u.tipo,
        activo: u.estado === "activo",
        avatar: u.avatar,
        color: u.color,
    };
}
