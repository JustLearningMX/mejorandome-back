#!/usr/bin/env bash
set -e

# ==============================================================================
# Script de despliegue en VPS para Control Personal de Salud (Backend)
# Ejecuta instalación de dependencias, generación de cliente y migraciones.
# NOTA: No arranca la aplicación (gestión delegada a PM2 / Nginx).
# ==============================================================================

echo "--------------------------------------------------------"
echo " Instando y preparando mejorandome-back en producción"
echo "--------------------------------------------------------"

# 1. Verificar existencia del archivo .env
if [ ! -f .env ]; then
  echo "❌ Error: No se encontró el archivo .env en la raíz del proyecto."
  echo "Por favor crea el archivo .env a partir de .env.example antes de continuar."
  exit 1
fi

# 2. Instalar dependencias limpias sólo de producción
echo "==> [1/3] Instalando dependencias de producción con npm ci..."
npm ci --omit=dev

# 3. Generar cliente de Prisma para la plataforma del VPS
echo "==> [2/3] Generando cliente de Prisma..."
npx prisma generate

# 4. Aplicar migraciones pendientes a la base de datos
echo "==> [3/3] Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "--------------------------------------------------------"
echo "✅ Preparación completada con éxito."
echo "Puedes iniciar o recargar el servicio en PM2 (ej: pm2 reload mejorandome-back)."
echo "--------------------------------------------------------"
