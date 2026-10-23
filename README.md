# Control Personal de Salud — Backend

API REST para la aplicación **Control Personal de Salud**. Este repositorio contiene únicamente el backend, desarrollado con NestJS y TypeScript, y se mantiene separado del repositorio del frontend Astro.

La API proporcionará operaciones para registrar y consultar el peso corporal, la alimentación y la saciedad, el ejercicio realizado y los pasos diarios. También podrá exponer información agregada para los resúmenes y las gráficas del frontend.

## Estado del proyecto

**En desarrollo — Backend**

## Responsabilidades

- Exponer una API REST consistente para el frontend.
- Validar los datos de entrada y aplicar las reglas de negocio.
- Gestionar el registro y la consulta de mediciones de peso.
- Gestionar registros de alimentación, hambre, saciedad y deseo de repetir.
- Gestionar sesiones de ejercicio, duración y pasos diarios.
- Proporcionar datos para resúmenes diarios y semanales.
- Mantener una estructura modular, comprobable y fácil de evolucionar.

## Stack tecnológico

| Tecnología | Uso |
|---|---|
| NestJS | Framework del backend |
| TypeScript | Lenguaje principal |
| Node.js | Entorno de ejecución |
| API REST | Comunicación con el frontend |
| Base de datos | Pendiente de definir |
| ORM / acceso a datos | Pendiente de definir |
| Validación y documentación de API | Se definirán durante la configuración inicial |

No se considera decidida una base de datos, una solución de autenticación ni un ORM. Estas decisiones deberán documentarse antes de implementar dependencias específicas.

## Dominios funcionales

### Peso corporal

- Crear una medición de peso asociada a una fecha.
- Consultar el historial de mediciones.
- Obtener datos para tendencias y promedios por periodo.

### Alimentación y saciedad

- Registrar comidas y descripciones flexibles de porciones.
- Registrar el hambre antes de comer y la saciedad al terminar.
- Registrar el deseo de repetir, si se hizo una pausa y si se consumió una porción adicional.
- Registrar, cuando corresponda, el contexto o la emoción asociados al antojo.

### Actividad física

- Registrar el tipo de ejercicio y su duración en minutos.
- Registrar los pasos diarios introducidos manualmente desde el iPhone.
- Consultar el historial de actividad.

La primera versión contempla el registro manual de pasos. La integración automática con Apple Health queda fuera del alcance inicial y requerirá investigación específica.

### Resúmenes

- Preparar datos agregados por día y semana.
- Obtener promedios de peso, pasos y duración del ejercicio.
- Proporcionar los registros necesarios para las visualizaciones del frontend.

Los cálculos y agregaciones deben realizarse en el backend cuando correspondan a reglas de negocio o a consultas sobre conjuntos de datos, evitando duplicar lógica de dominio en el frontend.

## Arquitectura

Se propone una **aplicación modular de NestJS**, organizada por dominios funcionales y con responsabilidades separadas. No se debe introducir una arquitectura distribuida ni capas adicionales sin una necesidad concreta.

### Estructura inicial propuesta

```text
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── decorators/
│   ├── config/
│   ├── health/
│   │   ├── health.module.ts
│   │   ├── health.controller.ts
│   │   └── health.service.ts
│   ├── weight/
│   │   ├── weight.module.ts
│   │   ├── weight.controller.ts
│   │   ├── weight.service.ts
│   │   ├── dto/
│   │   └── entities/
│   ├── nutrition/
│   │   ├── nutrition.module.ts
│   │   ├── nutrition.controller.ts
│   │   ├── nutrition.service.ts
│   │   ├── dto/
│   │   └── entities/
│   ├── activity/
│   │   ├── activity.module.ts
│   │   ├── activity.controller.ts
│   │   ├── activity.service.ts
│   │   ├── dto/
│   │   └── entities/
│   └── summaries/
│       ├── summaries.module.ts
│       ├── summaries.controller.ts
│       └── summaries.service.ts
├── test/
├── .env.example
├── .gitignore
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

Esta estructura es una guía inicial, no una obligación de crear todos los archivos de inmediato. Los directorios `entities/` y la organización del acceso a datos deberán ajustarse a la tecnología de persistencia que se elija.

### Responsabilidades de las capas

- **Controllers:** traducen las solicitudes HTTP a llamadas de aplicación y devuelven respuestas. No contienen reglas de negocio ni consultas de persistencia complejas.
- **Services / casos de uso:** coordinan las operaciones y aplican las reglas de negocio correspondientes.
- **DTOs:** definen y validan los contratos de entrada y, cuando proceda, los de salida.
- **Persistencia:** encapsula el acceso a la base de datos detrás de la abstracción apropiada para la solución elegida.
- **Common:** contiene únicamente utilidades transversales que tengan un uso real en varios módulos.
- **Config:** valida y centraliza la configuración de entorno.

No es obligatorio crear interfaces, repositorios o clases de dominio para cada entidad. Añádelos cuando aporten aislamiento, reglas de negocio claras o capacidad de prueba; evita capas ceremoniales que solo reenvíen llamadas.

## Contrato con el frontend

El frontend Astro se mantiene en un repositorio independiente y consumirá esta API mediante HTTP.

La URL base prevista en desarrollo es:

```text
http://localhost:3000/api
```

El prefijo `/api` deberá configurarse de forma consistente en NestJS y documentarse en la configuración del frontend. La URL anterior es un valor inicial de desarrollo, no una URL de producción.

Los contratos HTTP deben ser explícitos y estables. Los DTOs no deben exponer directamente modelos internos de persistencia si eso acopla la API a la implementación de la base de datos.

## Requisitos previos

- Node.js en una versión LTS compatible con la versión de NestJS instalada.
- npm.
- Git.

La versión concreta de Node.js y de las dependencias deberá fijarse en el proyecto y documentarse en sus archivos de configuración.

## Instalación

Desde la raíz del repositorio:

```bash
npm install
```

## Configuración local

1. Crea un archivo `.env` a partir de `.env.example`.
2. Define las variables requeridas por la configuración del proyecto.
3. No agregues secretos reales al repositorio.

Las variables definitivas dependerán de la base de datos, el sistema de autenticación y las herramientas que se seleccionen. La aplicación debe validar las variables obligatorias al iniciar y fallar con un mensaje claro si la configuración es inválida.

## Desarrollo

```bash
npm run start:dev
```

## Compilación

```bash
npm run build
```

## Ejecución de producción

```bash
npm run start:prod
```

Estos comandos son los habituales de un proyecto NestJS generado con su CLI. Los scripts definitivos deben coincidir con `package.json`.

## Pruebas y calidad

Ejecuta los scripts disponibles en `package.json`. En el proyecto se deberán mantener, como mínimo:

- Pruebas unitarias para reglas de negocio y servicios.
- Pruebas de integración para los flujos críticos de API y persistencia.
- Pruebas e2e para los endpoints principales.
- Lint y comprobación de tipos antes de integrar cambios.

No afirmes que una prueba pasó sin ejecutarla. Si una prueba no puede ejecutarse, explica la razón.

## Principios de diseño

- **SOLID:** asignar responsabilidades claras, depender de abstracciones cuando exista una necesidad real y evitar módulos excesivamente acoplados.
- **DRY:** centralizar reglas duplicadas, sin crear abstracciones prematuras ni ocultar diferencias legítimas.
- **YAGNI:** implementar lo necesario para los requisitos actuales; no anticipar funcionalidades no acordadas.
- **Separación de responsabilidades:** los controladores gestionan HTTP; las reglas de negocio permanecen fuera de ellos.
- **Patrones de diseño:** aplicar patrones cuando resuelvan un problema concreto, no por cumplir una lista.
- **Composición sobre herencia:** preferir servicios y dependencias pequeñas y explícitas.
- **Tipado estricto:** evitar `any`; validar los datos que llegan por HTTP en tiempo de ejecución.
- **Errores consistentes:** devolver respuestas HTTP apropiadas sin filtrar detalles internos ni secretos.
- **Seguridad por defecto:** validar entradas, proteger la configuración y limitar la exposición de datos personales.
- **Privacidad:** recopilar y devolver únicamente los datos necesarios para la funcionalidad solicitada.

## Convenciones de desarrollo

### Control de versiones

- Los commits deben reflejar únicamente la autoría de **JustLearningMX**. No incluir coautoría ni referencias a otros colaboradores.
- Escribir mensajes de commit claros, concisos y en imperativo.
- Realizar commits atómicos: cada commit representa un cambio lógico e independiente.

#### Estrategia de ramas

- `main`: contiene exclusivamente liberaciones de versiones estables.
- `develop`: rama de integración para cambios aprobados.
- Las ramas de trabajo se crean desde `develop` y siguen esta nomenclatura:
  - `feat/<descripcion>` — nueva funcionalidad.
  - `fix/<descripcion>` — corrección de errores.
  - `refactor/<descripcion>` — reestructuración sin cambiar el comportamiento.
  - `chore/<descripcion>` — mantenimiento, configuración o dependencias.
- Al terminar, integrar cada rama mediante pull request hacia `develop`.

### Código limpio

- Usar nombres descriptivos y código que exprese su intención.
- Mantener las funciones y clases enfocadas en una responsabilidad.
- Evitar comentarios que repitan lo evidente.
- Eliminar código muerto, dependencias sin uso y abstracciones innecesarias.
- Mantener consistencia con los patrones ya establecidos en el repositorio.

## Seguridad y datos personales

Los registros pueden revelar información personal relacionada con la salud y los hábitos. Por ello:

- No registrar información sensible innecesaria en logs.
- No incluir secretos, credenciales ni datos personales reales en pruebas o fixtures.
- Validar y normalizar las entradas.
- No exponer trazas internas, consultas ni detalles de infraestructura en respuestas de producción.
- Definir autenticación y autorización antes de permitir acceso desde usuarios o redes no confiables.
- Configurar CORS para los orígenes realmente necesarios; no habilitar todos los orígenes indiscriminadamente en producción.

## Fases de desarrollo

### Fase 1 — Base del backend

- Inicializar el proyecto NestJS.
- Definir configuración y validación de variables de entorno.
- Configurar prefijo global `/api`.
- Definir formato consistente de errores y validación de DTOs.
- Crear un endpoint de salud.
- Acordar la persistencia antes de desarrollar operaciones que dependan de ella.

### Fase 2 — Funcionalidades principales

- Implementar el módulo de peso.
- Implementar el módulo de alimentación y saciedad.
- Implementar el módulo de actividad.
- Implementar los resúmenes diarios y semanales.
- Añadir pruebas unitarias, de integración y e2e según corresponda.

### Fase 3 — Integración y endurecimiento

- Integrar el frontend Astro.
- Configurar CORS para los entornos necesarios.
- Revisar validación, errores, privacidad y logs.
- Definir autenticación si el alcance de usuarios lo requiere.
- Preparar la configuración de despliegue.

## Alcance

Este backend proporciona funciones de registro y consulta para una aplicación personal de seguimiento de hábitos. No realiza diagnósticos ni sustituye la atención profesional de salud.

---

**Proyecto:** Control Personal de Salud — Backend  
**Framework:** NestJS  
**Lenguaje:** TypeScript  
**Interfaz:** API REST  
**Frontend:** Proyecto Astro independiente
