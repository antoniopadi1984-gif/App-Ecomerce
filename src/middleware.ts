import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Solo aplicar a APIs internas
    if (pathname.startsWith('/api/')) {
        // Excluir rutas de auth y webhooks si es necesario (webhooks suelen traer storeId en payload o URL)
        if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/webhooks')) {
            return NextResponse.next();
        }

        // 1. Intentar obtener storeId de cookies
        let activeStoreId = request.cookies.get('activeStoreId')?.value;

        // 2. Si no hay storeId, usar store-main por defecto (Absolute Zero V15.0 logic)
        if (!activeStoreId) {
            activeStoreId = 'store-main';
            console.log("⚠️ [Middleware] No activeStoreId cookie, using fallback: store-main");
        }

        // 3. Inyectar header x-store-id
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-store-id', activeStoreId);

        // Continuar con los headers modificados
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*'],
};
