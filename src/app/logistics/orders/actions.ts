'use server';

import { pushOrderToBeeping } from '../../operaciones/pedidos/actions';

export async function exportOrderToBeeping(orderId: string) {
    // Deprecated — delega a pushOrderToBeeping
    return pushOrderToBeeping(orderId);
}
