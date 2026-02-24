export const SPENCER_PAWLIN_METHODOLOGY = {
    NOMENCLATURE: {
        VIDEO_ADS: "[FECHA]_[MARCA]_[ANGULO]_[HOOK]_[VAR_VISUAL]_[EDITOR]",
        STATIC_ADS: "[FECHA]_[MARCA]_[ANGULO]_[CONCEPT]_[VAR_COPY]",
        RULES: [
            "FECHA: Formato YYMMDD",
            "ANGULO: Nombre corto del ángulo psicológico (ej: AHORRO, STATUS, MIEDO)",
            "HOOK: Identificador del hook (ej: H1, H2, H3)",
            "VARIANT: Identificador de la variante visual o de copy",
            "Usa siempre GUIONES BAJOS (_) para separar, nunca espacios",
            "Usa siempre MAYÚSCULAS para las etiquetas fijas"
        ]
    },
    DRIVE_STRUCTURE: {
        LEVEL_1: "00_ESTRATEGIA_Y_BRIEFS",
        LEVEL_2: "01_RAW_ASSETS (Material Bruto)",
        LEVEL_3: "02_PRODUCCION_EN_CURSO",
        LEVEL_4: "03_FINALES_PARA_PAUTA (Ready to Launch)",
        LEVEL_5: "04_BACKUP_HISTORICO"
    },
    MEDIA_BUYING: {
        TESTING_PHASE: {
            NAME: "Creative Testing (Spencer Style)",
            PROCESO: [
                "Testeo masivo de HOOKS (los primeros 3 seg son el 80% del éxito)",
                "Testeo de VISUALES (la miniatura y el b-roll inicial)",
                "Uso de Broad Targeting (dejar que el algoritmo encuentre al público)",
                "Presupuesto CBO/ABO según volumen de variaciones"
            ],
            METRICS_FOCUS: ["Hook Rate (3s view / impressions)", "Hold Rate (ThruPlays / impressions)", "CPA In-App"]
        },
        SCALING_PHASE: {
            HORIZONTAL: "Duplicar conjuntos ganadores para atacar nuevos bolsillos de audiencia",
            VERTICAL: "Aumentar presupuesto un 20% cada 48h en campañas estables"
        }
    }
};
