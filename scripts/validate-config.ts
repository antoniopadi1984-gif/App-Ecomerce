import { validateConfig } from '../src/lib/config/api-config';
import { getAgentStats } from '../src/lib/agents/agent-registry';

async function main() {
    console.log('🔍 Validando Configuración de Agentes...');

    const validation = validateConfig();

    if (!validation.valid) {
        console.error('❌ Errores de Configuración detectados:');
        validation.errors.forEach(err => console.error(`   - ${err}`));
    } else {
        console.log('✅ Configuración base de APIs cargada correctamente.');
    }

    const stats = getAgentStats();
    console.log('\n📊 Estadísticas de Agentes Registrados:');
    console.log(`   - Total Agentes: ${stats.total}`);
    console.log(`   - Tier 1 (Creatividad): ${stats.byTier.tier1}`);
    console.log(`   - Tier 2 (Investigación): ${stats.byTier.tier2}`);
    console.log(`   - Tier 3 (Operaciones): ${stats.byTier.tier3}`);

    console.log('\n🤖 Distribución por Proveedor:');
    console.log(`   - Anthropic (Claude): ${stats.byProvider.claude}`);
    console.log(`   - Google (Gemini Pro): ${stats.byProvider.geminiPro}`);
    console.log(`   - Google (Gemini Flash): ${stats.byProvider.geminiFlash}`);

    console.log('\n💡 Validación finalizada.');

    if (!validation.valid) {
        process.exit(1);
    }
}

main().catch(console.error);
