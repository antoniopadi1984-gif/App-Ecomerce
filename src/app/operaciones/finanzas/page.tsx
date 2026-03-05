// Redirect permanente al módulo Finanzas independiente
import { redirect } from 'next/navigation';

export default function FinanzasRedirectPage() {
    redirect('/finanzas');
}
