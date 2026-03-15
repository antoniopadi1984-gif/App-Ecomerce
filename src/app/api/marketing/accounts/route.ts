import { NextRequest, NextResponse } from 'next/server';
import { getConnectionSecret } from '@/lib/server/connections';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const storeId = req.headers.get('X-Store-Id') || 'store-main';

    const token = await getConnectionSecret(storeId, 'META');
    if (!token) return NextResponse.json({ error: 'Meta token no configurado' }, { status: 401 });

    // 1. Descubrir todas las cuentas publicitarias accesibles
    const accountsRes = await fetch(
        `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_id,account_status,currency,timezone_name,business,spend_cap,amount_spent&limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const accountsData = await accountsRes.json();

    if (accountsData.error) {
        return NextResponse.json({ error: accountsData.error.message }, { status: 400 });
    }

    // 2. Para cada cuenta, obtener páginas e Instagram asociadas
    const accounts = await Promise.all(
        (accountsData.data || []).map(async (account: any) => {
            // Páginas de Facebook asociadas
            const pagesRes = await fetch(
                `https://graph.facebook.com/v19.0/${account.id}/pages?fields=id,name,fan_count,instagram_business_account`,
                { headers: { Authorization: `Bearer ${token}` } }
            ).then(r => r.json()).catch(() => ({ data: [] }));

            return {
                id: account.id,
                accountId: account.account_id,
                name: account.name,
                status: account.account_status,
                currency: account.currency,
                timezone: account.timezone_name,
                amountSpent: account.amount_spent,
                business: account.business?.name,
                pages: pagesRes.data || [],
            };
        })
    );

    return NextResponse.json({ ok: true, accounts, total: accounts.length });
}
