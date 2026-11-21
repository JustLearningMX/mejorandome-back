# Tutorial - Cómo subir el backend (mejorandome-back) al VPS de OCI

> **Estado:** los pasos 3 a 7 y la verificación de salud ya se ejecutaron en el despliegue real (2026-11-21). Los pasos marcados con ⚠️ **siguen sin verificar** (activación del refresh token y primer arranque de PM2).

## 1. Arquitectura en producción

| Pieza | Valor | Origen del dato |
|---|---|---|
| URL pública de la API | `https://hiram-oci-mty.duckdns.org/mejorandome-back/v1/api` | Diagnóstico del front |
| Proxy inverso | Nginx, SSL con DuckDNS | Diagnóstico del front |
| Bloque Nginx | `location /mejorandome-back/v1/ { proxy_pass http://localhost:3005/; ... }` | Revisión del VPS |
| Puerto de Nest | `3005` (`PORT`) | Revisión del VPS / `.env.example` |
| Gestor de procesos | PM2, proceso `mejorandome-back` | Despliegue real |
| Base de datos | MySQL 8.x en OCI | `AGENTS.md` |
| Ruta de la app en el VPS | `/home/ubuntu/proyectos-backend/mejorandome-back` (usuario `ubuntu`) | `pm2 describe` |
| Proceso PM2 | id 2, `fork_mode`, `script path` `.../mejorandome-back/dist/main.js`, **`exec cwd` `.../mejorandome-back/dist`**, Node 22.21.0 | `pm2 describe` |
| Logs PM2 | `/home/ubuntu/.pm2/logs/mejorandome-back-out.log` y `-error.log` | `pm2 describe` |
| Método de subida | SFTP con Termius, sobre la conexión SSH ya configurada | Despliegue real |
| Health check | `GET /mejorandome-back/v1/api/health` | Despliegue real |

Nginx quita el prefijo `/mejorandome-back/v1/` (la barra final del `proxy_pass`), así que Nest recibe `/api/...`. Por eso el backend usa el prefijo `/api` y **no** conoce `/mejorandome-back/v1`.

## 2. Requisitos previos en el VPS

- Node.js LTS compatible con NestJS y npm.
- PM2 instalado, con el proceso `mejorandome-back` ya registrado.
- Termius (o cualquier cliente SFTP) con el host del VPS configurado por SSH.
- MySQL accesible desde el VPS y una base de datos creada para la app.
- Archivo `.env` de producción (se crea a mano en el VPS, nunca se sube a git).

## 3. Preparar el paquete (en tu PC)

Desde la raíz del repo, en la rama que quieras desplegar. Requiere `node_modules` completo (si lo instalaste con `--omit=dev`, haz `npm ci` antes):

```bash
npm run build:vps
# equivalente en Git Bash: ./scripts/prepare-vps.js
```

Ejecuta `scripts/prepare-vps.js`, que:
1. Compila con `npm run build`.
2. Recrea `deploy/mejorandome-back/` (carpeta ignorada por git).
3. Copia `dist/`, `prisma/schema.prisma`, `prisma/migrations/`, `package.json`, `package-lock.json`, `.env.example` y `scripts/setup-prod.sh|js` (con saltos de línea LF).

Resultado:

```text
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
```

## 4. Subir al VPS

1. Abre **Termius** y conéctate por **SFTP** al VPS (host ya configurado por SSH).
2. En una segunda ventana SSH, ve a la carpeta de la app y borra las dependencias anteriores: `rm -r node_modules`. (Opcional: `npm ci` ya las reemplaza en el paso 6.)
3. Por SFTP, copia **todo el contenido** de `deploy/mejorandome-back/` (`dist/`, `prisma/`, `scripts/`, `package.json`, `package-lock.json`, `.env.example`) sobre la carpeta de la app en el VPS, reemplazando lo anterior.
4. **No sobrescribas el `.env` del VPS**: el paquete solo trae `.env.example`.

> El SFTP no conserva el bit de ejecución de los scripts; por eso en el paso 6 se invocan con `bash` o `node` (ver ahí).

## 5. Configurar el `.env` de producción (en el VPS)

Parte de `.env.example`. Variables:

| Variable | Producción | Notas |
|---|---|---|
| `NODE_ENV` | `production` | Obligatorio: de esto depende el flag `Secure` de la cookie de refresh |
| `PORT` | `3005` | Debe coincidir con el `proxy_pass` de Nginx |
| `CORS_ORIGIN` | orígenes del front separados por coma | Ej. `https://justlearningmx.github.io` |
| `DATABASE_URL` | `mysql://usuario:clave@host:3306/base` | Secreto, solo en el VPS |
| `GOOGLE_CLIENT_ID` | client ID de Google OAuth | El mismo que usa el front |
| `JWT_SECRET` | cadena larga aleatoria | Secreto |
| `JWT_EXPIRES_IN` | `7d` hoy; `1h` al activar refresh | Ver sección 8 |
| `REFRESH_TOKENS_ENABLED` | `false` hasta que el front esté listo | Luego `true` |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | |
| `REFRESH_COOKIE_PATH` | `/mejorandome-back/v1/api/auth` | Path **público**: Nginx no reescribe cookies |

La app valida el `.env` al arrancar y falla con un mensaje claro si algo es inválido.

En el despliegue del refresh token se agregaron las variables nuevas con `REFRESH_TOKENS_ENABLED=false` (se activa después, sección 8).

## 6. Detener, instalar y migrar (en el VPS)

Desde la carpeta de la app, primero detén el servicio:

```bash
pm2 stop mejorandome-back
```

Luego ejecuta **uno** de los dos scripts (hacen lo mismo):

```bash
bash scripts/setup-prod.sh      # o: node scripts/setup-prod.js
```

Si prefieres ejecutarlo directo (`./scripts/setup-prod.js`) y da `Permission denied`, es porque el SFTP perdió el bit de ejecución: `chmod +x ./scripts/setup-prod.js` (o usa `bash`/`node` como arriba).

Salida esperada al final: `All migrations have been successfully applied.` y `✅ Preparación completada con éxito.`

Hace, en orden (aborta si no existe `.env`):
1. `npm ci --omit=dev`: dependencias de producción.
2. `npx prisma generate`: cliente de Prisma para la plataforma del VPS.
3. `npx prisma migrate deploy`: aplica migraciones pendientes (incluida `20261121120000_add_refresh_tokens`).

**No arranca la app.**

> MySQL hace commit implícito en cada `ALTER TABLE`. Si una migración falla a medias, revisa qué sentencias alcanzaron a aplicarse antes de usar `prisma migrate resolve` (ver `AGENTS.md`).

## 7. Arrancar o recargar con PM2

Despliegues (verificado): tras `pm2 stop` y `setup-prod`, levanta el proceso:

```bash
pm2 restart mejorandome-back
```

Si cambiaste variables del `.env` y no se reflejan, usa `pm2 restart mejorandome-back --update-env`. Verifica con `pm2 ls` y `pm2 logs mejorandome-back`.

Cómo está registrado hoy el proceso (según `pm2 describe`): `script path` = `/home/ubuntu/proyectos-backend/mejorandome-back/dist/main.js`, sin argumentos, `fork_mode`, `exec cwd` = la carpeta `dist/` (no la raíz de la app). Eso indica que se arrancó estando dentro de `dist/`. No hay evidencia de un `ecosystem.config.js`.

⚠️ Primer arranque en un VPS nuevo (inferido, no verificado): estando en la raíz de la app, `pm2 start dist/main.js --name mejorandome-back` y luego `pm2 save`. Ojo: así el `cwd` sería la raíz y no `dist/`; el `.env` se lee relativo al `cwd` (ver nota abajo).

> **Cómo se lee el `.env` (comprobado en parte):** con `cwd = dist/`, `ConfigModule` buscaría `dist/.env`, que **no existe** (verificado en el VPS con `ls -la dist/.env`). Aun así la API funciona porque el Prisma Client generado trae `schemaEnvPath: "../../../.env"` (la raíz de la app) y carga ese archivo al importarse. Esto significa que el `.env` de la raíz es el único válido, pero depende de Prisma; no crear un `dist/.env` aparte. Falta confirmar en la práctica que las variables nuevas se toman: sección 8.

`pm2 describe` también mostró `restarts: 30` (acumulados desde la creación, 2026-11-21T16:38Z). Si crece sin que reinicies, revisar `pm2 logs mejorandome-back --err`.

## 8. Activar el refresh token (cuando el front esté desplegado)

1. En el `.env`: `REFRESH_TOKENS_ENABLED=true` y `JWT_EXPIRES_IN=1h`.
2. `pm2 restart mejorandome-back --update-env`.
3. Verificar la cookie:

```bash
curl -i -X POST https://hiram-oci-mty.duckdns.org/mejorandome-back/v1/api/auth/logout
```

Debe responder `204` con `Set-Cookie: mejorandome_rt=; Path=/mejorandome-back/v1/api/auth; Expires=...; HttpOnly; Secure; SameSite=Strict`.

Contrato completo para el front: `mejorandome-front/.references/from-backend/2026.11.21-auth-refresh-endpoints.md`.

Resultado verificado (2026-11-21, con `REFRESH_TOKENS_ENABLED=true`):

| Prueba | Resultado |
|---|---|
| `POST /auth/logout` sin cookie | `204` con `Set-Cookie: mejorandome_rt=; Path=/mejorandome-back/v1/api/auth; Expires=1970...; HttpOnly; Secure; SameSite=Strict` |
| `POST /auth/refresh` sin cookie | `401` `{"code":"REFRESH_TOKEN_MISSING"}` (prueba que el flag está activo; con `false` sería 404) |
| `GET /auth/me` sin token | `401` `{"code":"ACCESS_TOKEN_INVALID"}` |
| `GET /health` | `200` |

Pendiente de verificar con un login real desde el front: que `/auth/google` entregue `Set-Cookie: mejorandome_rt=<valor>` (pestaña Network del navegador, la cookie `httpOnly` no se ve desde JavaScript) y que, tras `JWT_EXPIRES_IN=1h`, el front renueve sin pedir login.

## 9. Verificación post-despliegue

- `pm2 ls`: el proceso está `online`.
- Salud: abrir o hacer `curl -i https://hiram-oci-mty.duckdns.org/mejorandome-back/v1/api/health` y comprobar estatus OK (verificado).
- Login desde el front y una petición autenticada.

## 10. Problemas frecuentes

| Síntoma | Causa probable |
|---|---|
| `'nest' is not recognized` al correr `npm run build:vps` | `node_modules` local quedó sin devDependencies (típico tras correr `setup-prod` o `npm ci --omit=dev` en tu PC). Solución: `npm ci` y reintentar. `setup-prod` se ejecuta **solo en el VPS** |
| `Permission denied` al ejecutar `./scripts/setup-prod.js` o `.sh` | El SFTP no conserva el bit de ejecución. Usa `bash scripts/setup-prod.sh` / `node scripts/setup-prod.js`, o `chmod +x` |
| `setup-prod` dice que falta `.env` | Se ejecutó fuera de la carpeta de la app o no se creó el archivo |
| La app no arranca y muestra "Configuración de variables de entorno inválida" | Falta o es inválida alguna variable del `.env` |
| 502 desde Nginx | La app no está corriendo o `PORT` no coincide con el `proxy_pass` |
| La cookie de refresh no llega al front | `REFRESH_COOKIE_PATH` incorrecto o `NODE_ENV` distinto de `production` |
| Error de columna duplicada/inexistente al reintentar una migración | La migración falló a medias (commit implícito de MySQL); ver sección 6 |

## 11. Historial de cambios del tutorial

- 2026-11-21: borrador inicial inferido de los scripts.
- 2026-11-21: confirmado con el despliegue real: subida por SFTP (Termius), `pm2 stop` → `setup-prod` (migraciones aplicadas) → `pm2 restart`, y `/health` OK. Se desplegó con `REFRESH_TOKENS_ENABLED=false`; falta activar el refresh token (sección 8).
- 2026-11-21: refresh token activado en producción (`REFRESH_TOKENS_ENABLED=true`). Pruebas con `curl` OK; el login real emitió `Set-Cookie: mejorandome_rt` con los atributos esperados (vigencia 30 días). Se cambió `JWT_EXPIRES_IN` a `1h`. Pendiente: confirmar `"expiresIn":"1h"` en la respuesta y la renovación automática tras 1 hora.
