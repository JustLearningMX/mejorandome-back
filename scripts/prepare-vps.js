#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const targetDir = join(rootDir, 'deploy', 'mejorandome-back');

console.log('========================================================');
console.log(' Generando paquete para VPS: mejorandome-back');
console.log('========================================================');

// 1. Compilar el proyecto NestJS
console.log('\n==> [1/4] Compilando la aplicación (npm run build)...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error al compilar el proyecto.');
  process.exit(error.status ?? 1);
}

// 2. Limpiar y crear directorio de destino
console.log(`\n==> [2/4] Preparando carpeta de salida: ${targetDir}`);
if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true });
}
mkdirSync(targetDir, { recursive: true });

// 3. Copiar componentes requeridos
console.log('\n==> [3/4] Copiando archivos de distribución...');

// dist/
console.log('  -> dist/');
cpSync(join(rootDir, 'dist'), join(targetDir, 'dist'), { recursive: true });

// prisma/ (schema y migraciones)
console.log('  -> prisma/');
mkdirSync(join(targetDir, 'prisma'), { recursive: true });
cpSync(join(rootDir, 'prisma', 'schema.prisma'), join(targetDir, 'prisma', 'schema.prisma'));
if (existsSync(join(rootDir, 'prisma', 'migrations'))) {
  cpSync(join(rootDir, 'prisma', 'migrations'), join(targetDir, 'prisma', 'migrations'), {
    recursive: true,
  });
}

// package.json y package-lock.json
console.log('  -> package.json & package-lock.json');
cpSync(join(rootDir, 'package.json'), join(targetDir, 'package.json'));
cpSync(join(rootDir, 'package-lock.json'), join(targetDir, 'package-lock.json'));

// .env.example
console.log('  -> .env.example');
cpSync(join(rootDir, '.env.example'), join(targetDir, '.env.example'));

// scripts/ dentro de la carpeta destino
console.log('  -> scripts/ (setup-prod.sh & setup-prod.js)');
const targetScriptsDir = join(targetDir, 'scripts');
mkdirSync(targetScriptsDir, { recursive: true });

// Copiar setup-prod.sh asegurando formato LF (Linux)
const shContent = readFileSync(join(rootDir, 'scripts', 'setup-prod.sh'), 'utf8');
const normalizedSh = shContent.replace(/\r\n/g, '\n');
writeFileSync(join(targetScriptsDir, 'setup-prod.sh'), normalizedSh, {
  encoding: 'utf8',
  mode: 0o755,
});

// Copiar setup-prod.js
const jsContent = readFileSync(join(rootDir, 'scripts', 'setup-prod.js'), 'utf8');
const normalizedJs = jsContent.replace(/\r\n/g, '\n');
writeFileSync(join(targetScriptsDir, 'setup-prod.js'), normalizedJs, {
  encoding: 'utf8',
  mode: 0o755,
});

// 4. Resumen
console.log('\n==> [4/4] Verificación de estructura generada:');
console.log(`
deploy/mejorandome-back/
├── dist/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
│   ├── setup-prod.sh
│   └── setup-prod.js
├── package.json
├── package-lock.json
└── .env.example
`);

console.log('========================================================');
console.log('✅ Paquete generado exitosamente.');
console.log(`Ruta local: ${targetDir}`);
console.log('\nPasos en el VPS:');
console.log('  1. Sube la carpeta "mejorandome-back" a tu VPS (ej. en /var/www/ o tu directorio habitual).');
console.log('  2. Crea el archivo .env con tus valores de producción a partir de .env.example.');
console.log('  3. Ejecuta en el VPS: bash scripts/setup-prod.sh  (o node scripts/setup-prod.js)');
console.log('  4. Configura/recarga tu proceso en PM2 como de costumbre.');
console.log('========================================================\n');
