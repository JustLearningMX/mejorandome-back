#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

console.log('--------------------------------------------------------');
console.log(' Preparando mejorandome-back en producción');
console.log('--------------------------------------------------------');

if (!existsSync('.env')) {
  console.error('❌ Error: No se encontró el archivo .env en la raíz del proyecto.');
  console.error('Por favor crea el archivo .env a partir de .env.example antes de continuar.');
  process.exit(1);
}

function run(command, description) {
  console.log(`\n==> ${description}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\n❌ Error ejecutando: ${command}`);
    process.exit(error.status ?? 1);
  }
}

run('npm ci --omit=dev', '[1/3] Instalando dependencias de producción...');
run('npx prisma generate', '[2/3] Generando cliente de Prisma...');
run('npx prisma migrate deploy', '[3/3] Aplicando migraciones de Prisma...');

console.log('\n--------------------------------------------------------');
console.log('✅ Preparación completada con éxito.');
console.log('Puedes iniciar o recargar el servicio en PM2.');
console.log('--------------------------------------------------------');
