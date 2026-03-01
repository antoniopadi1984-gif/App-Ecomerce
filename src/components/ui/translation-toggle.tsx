'use client';

import React, { useState } from 'react';
import { Loader2, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MARKET_LANGUAGES, needsTranslation } from '@/lib/translation';

interface TranslationToggleProps {
    /** The original text in market language */
    text: string;
    /** Market language code (EN, FR, DE, IT…) */
    marketLang: string;
    /** Optional DB cache lookup */
    cacheTarget?: 'researchStep' | 'creativeAsset' | 'comboMatrix';
    cacheId?: string;
    /** Optional context hint for Gemini (e.g. 'video script', 'ad hook') */
    context?: string;
    /** Class names for the text container */
    className?: string;
    /** Render function: receives the text to display (original or translated) */
    children?: (text: string, lang: 'market' | 'es') => React.ReactNode;
}

/**
 * TranslationToggle — EN | ES pill toggle
 *
 * Usage:
 *   <TranslationToggle text={step.outputText} marketLang={product.marketLanguage}>
 *     {(displayText) => <p>{displayText}</p>}
 *   </TranslationToggle>
 *
 * - If market language === ES: renders children(text, 'market') with no toggle
 * - If needsTranslation: shows flag toggle, calls /api/translate on demand
 * - Caches result in-component (stays during session, DB persisted via API)
 */
export function TranslationToggle({
    text,
    marketLang,
    cacheTarget,
    cacheId,
    context,
    className,
    children,
}: TranslationToggleProps) {
    const [showEs, setShowEs] = useState(false);
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const shouldTranslate = needsTranslation(marketLang) && text?.trim();
    const langInfo = MARKET_LANGUAGES[marketLang] ?? { flag: '🌐', label: marketLang };
    const displayText = showEs ? (translatedText ?? text) : text;
    const currentLang: 'market' | 'es' = showEs ? 'es' : 'market';

    const handleToggle = async () => {
        if (!shouldTranslate) return;

        if (!showEs) {
            // Switch to ES
            if (translatedText) {
                setShowEs(true);
                return;
            }
            setLoading(true);
            setError(false);
            try {
                const res = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text,
                        from: marketLang,
                        context,
                        cacheTarget,
                        cacheId,
                    }),
                });
                const data = await res.json();
                if (data.translatedText) {
                    setTranslatedText(data.translatedText);
                    setShowEs(true);
                } else {
                    throw new Error('Empty translation');
                }
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        } else {
            setShowEs(false);
        }
    };

    return (
        <div className={cn('relative', className)}>
            {/* Toggle pill — only shown when translation exists or market ≠ ES */}
            {shouldTranslate && (
                <button
                    onClick={handleToggle}
                    disabled={loading}
                    title={showEs ? `Ver en ${langInfo.label}` : 'Ver en Español'}
                    className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all border',
                        'absolute top-0 right-0 z-10',
                        showEs
                            ? 'bg-[var(--surface2)] border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--border)]'
                            : 'bg-[var(--inv)]/10 border-[var(--inv)]/20 text-[var(--inv)] hover:bg-[var(--inv)]/20',
                        loading && 'opacity-60 cursor-not-allowed'
                    )}
                >
                    {loading ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                        <Languages className="w-2.5 h-2.5" />
                    )}
                    {showEs ? (
                        <span>{langInfo.flag} {langInfo.label}</span>
                    ) : (
                        <span>🇪🇸 ES</span>
                    )}
                </button>
            )}

            {/* Content */}
            <div className={cn(shouldTranslate && 'pr-20')}>
                {children ? (
                    children(displayText, currentLang)
                ) : (
                    <span className={cn(
                        'whitespace-pre-wrap',
                        showEs && 'italic opacity-90'
                    )}>
                        {displayText}
                        {error && (
                            <span className="text-[var(--s-ko)] text-[9px] font-bold ml-2">[Error de traducción]</span>
                        )}
                    </span>
                )}
            </div>
        </div>
    );
}

/**
 * Inline lang badge — shows a small flag + code for the market language
 * Use next to titles to signal the language of generated content
 */
export function LangBadge({ marketLang }: { marketLang: string }) {
    if (!needsTranslation(marketLang)) return null;
    const info = MARKET_LANGUAGES[marketLang];
    if (!info) return null;

    return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-muted)]">
            {info.flag} {marketLang}
        </span>
    );
}
