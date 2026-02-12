#!/usr/bin/env tsx

/**
 * Verificar configuración del bucket de Google Cloud Storage
 */

import { Storage } from '@google-cloud/storage';

async function checkBucket() {
    console.log('🔍 Verificando configuración de Google Cloud Storage...\n');
    console.log('='.repeat(60));

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const bucketName = process.env.GCS_BUCKET_NAME;

    console.log(`\n📋 Configuración:\n`);
    console.log(`   Project ID: ${projectId || '❌ NO CONFIGURADO'}`);
    console.log(`   Bucket Name: ${bucketName || '❌ NO CONFIGURADO'}`);

    if (!projectId || !bucketName) {
        console.error('\n❌ Error: Variables de entorno no configuradas');
        console.log('\nAgrega a .env.local:');
        console.log('GOOGLE_CLOUD_PROJECT_ID=gen-lang-client-0246473908');
        console.log('GCS_BUCKET_NAME=ecompulse-creatives');
        process.exit(1);
    }

    try {
        const storage = new Storage({ projectId });

        console.log(`\n🔍 Verificando bucket "${bucketName}"...`);

        const [exists] = await storage.bucket(bucketName).exists();

        if (exists) {
            console.log(`✅ Bucket existe`);

            // Test de escritura
            const testFile = `test/${Date.now()}.txt`;
            const bucket = storage.bucket(bucketName);

            console.log(`\n📝 Test de escritura...`);
            await bucket.file(testFile).save('Test from Creative Factory', {
                metadata: { contentType: 'text/plain' }
            });

            console.log(`✅ Escritura exitosa`);

            // Test de lectura
            console.log(`📖 Test de lectura...`);
            const [content] = await bucket.file(testFile).download();
            console.log(`✅ Lectura exitosa: "${content.toString()}"`);

            // Test de URL pública
            console.log(`\n🌐 Haciendo archivo público...`);
            await bucket.file(testFile).makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${testFile}`;
            console.log(`✅ URL pública: ${publicUrl}`);

            // Cleanup
            console.log(`\n🧹 Limpiando archivo de test...`);
            await bucket.file(testFile).delete();
            console.log(`✅ Cleanup completo`);

            console.log('\n' + '='.repeat(60));
            console.log('\n✅ BUCKET CONFIGURADO CORRECTAMENTE\n');

        } else {
            console.log(`\n⚠️  Bucket NO existe. Creando...`);

            await storage.createBucket(bucketName, {
                location: 'US-CENTRAL1',
                storageClass: 'STANDARD'
            });

            console.log(`✅ Bucket creado: ${bucketName}`);
            console.log('\n' + '='.repeat(60));
            console.log('\n✅ BUCKET CREADO Y LISTO\n');
        }

    } catch (error: any) {
        console.error('\n❌ ERROR:\n');
        console.error(error.message);

        if (error.code === 7) {
            console.log('\n💡 Solución:');
            console.log('1. Ir a: https://console.cloud.google.com/storage');
            console.log('2. Crear bucket: ecompulse-creatives');
            console.log('3. Región: us-central1');
            console.log('4. Permisos: Permitir acceso público');
        }

        process.exit(1);
    }
}

checkBucket();
