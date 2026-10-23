# AGENTS.md — Backend NestJS

## Propósito del proyecto

Este repositorio contiene exclusivamente el backend de **Control Personal de Salud**, una API REST desarrollada con NestJS y TypeScript. El frontend Astro vive en otro repositorio. No crees ni reorganices archivos del frontend dentro de este proyecto.

La API cubrirá registros de peso, alimentación y saciedad, ejercicio, pasos diarios y resúmenes. Los pasos del iPhone se registrarán manualmente en la primera versión; no implementes integración automática con Apple Health sin un requisito explícito.

## Instrucciones prioritarias

1. Lee este archivo y el `README.md` antes de modificar el proyecto.
2. Si existe documentación de diseño o arquitectura adicional, revísala y respétala. Si existe `DESIGN.md`, es obligatorio seguirlo.
3. Inspecciona el código, `package.json`, la configuración y las pruebas antes de proponer cambios.
4. Sigue los patrones ya establecidos en el repositorio, salvo que exista una razón concreta para modificarlos.
5. No inventes decisiones de arquitectura que aún no se han tomado. La base de datos, el ORM y la autenticación deben confirmarse antes de introducir dependencias o implementar funcionalidades que dependan de ellos.
6. Mantén el alcance enfocado. No agregues funcionalidades, paquetes o capas solo porque podrían ser útiles en el futuro.

## Stack y límites

- Framework: NestJS.
- Lenguaje: TypeScript.
- Protocolo de integración: API REST.
- Frontend: Astro en un repositorio independiente.
- Persistencia, ORM, autenticación y despliegue: según decisiones documentadas posteriormente.

No cambies de framework ni agregues una segunda arquitectura de aplicación sin autorización explícita.

## Arquitectura y organización

Usa una aplicación modular organizada por dominios funcionales. Los módulos iniciales previstos son:

- `weight`: mediciones e historial de peso.
- `nutrition`: comidas, porciones, hambre, saciedad y deseo de repetir.
- `activity`: ejercicios, duración y pasos diarios.
- `summaries`: consultas agregadas para periodos.
- `health`: estado básico de la API.
- `common`: solo elementos transversales realmente compartidos.
- `config`: configuración y validación de variables de entorno.

La estructura exacta debe evolucionar con la implementación. No crees todos los archivos o módulos vacíos por adelantado.

### Responsabilidades

- **Controller:** define rutas HTTP, parámetros, códigos de estado y delega la operación. No contiene reglas de negocio complejas ni acceso directo a la base de datos.
- **Service / caso de uso:** coordina una operación y aplica las reglas de negocio.
- **DTO:** define el contrato de entrada y valida datos en tiempo de ejecución.
- **Persistencia:** encapsula el acceso a datos según la tecnología elegida.
- **Mapper:** úsalo solo cuando exista una transformación significativa entre contratos, modelos de dominio y persistencia.
- **Common:** no lo conviertas en un cajón de sastre; algo pertenece allí únicamente si es transversal y tiene una abstracción clara.

No implementes automáticamente Clean Architecture completa, CQRS, Event Sourcing, Mediator, repositorios genéricos o una capa de dominio independiente. Incorpora esas técnicas solo si los requisitos y la complejidad real las justifican.

## SOLID, DRY, diseño y código limpio

- **Código autoexplicativo y simplicidad (KISS):** Mantén el código lo más simple y directo posible. Evita comentarios innecesarios o que repitan lo evidente; el código debe explicarse por sí mismo mediante nombres descriptivos, funciones pequeñas y flujo de control transparente.
- **De lo genérico a lo puntual:** Diseña abstracciones y componentes reutilizables que resuelvan necesidades comunes de forma genérica para evitar código repetido (DRY). Solo especializa cuando la regla de negocio concreta lo demande.
- **Componentes y utilidades reutilizables:** Busca modularidad y desacoplamiento para que los elementos transversales sean testeables, portables y reutilizables en diferentes módulos.
- **S — Single Responsibility:** cada clase o función debe tener una sola responsabilidad coherente.
- **O — Open/Closed:** abierto a extensión y cerrado a modificación mediante polimorfismo o inyección cuando exista un punto de variación real.
- **L — Liskov Substitution:** las implementaciones intercambiables deben cumplir estrictamente el contrato que prometen.
- **I — Interface Segregation:** interfaces o contratos específicos y cohesivos; evita interfaces sobredimensionadas.
- **D — Dependency Inversion:** depender de abstracciones y desacoplar la lógica de negocio de los detalles de infraestructura mediante inyección de dependencias.
- **DRY (Don't Repeat Yourself):** centraliza lógica común y evita duplicidad de código.
- **Fail-Fast:** valida datos de entrada de inmediato en los límites de la API o del método para evitar propagación de estados inconsistentes.
- **Inmutabilidad y funciones puras:** prefiere estructuras inmutables y funciones sin efectos secundarios cuando proceses o transformes datos.
- **YAGNI:** no construyas funcionalidades anticipadas ni generalices antes de tener un caso de uso real.
- Prefiere composición sobre herencia.
- Mantén funciones cortas, nombres precisos y flujo de control legible.
- Evita métodos que solo reenvíen llamadas sin aportar responsabilidad.

## TypeScript y validación

- Usa tipos explícitos en contratos públicos y límites entre módulos.
- Evita `any`. Cuando el dato sea desconocido, utiliza `unknown` y valídalo antes de usarlo.
- No confíes en que TypeScript valida datos HTTP en tiempo de ejecución.
- Usa DTOs y las herramientas de validación compatibles con las dependencias instaladas.
- Valida fechas, rangos numéricos, unidades y campos requeridos en los límites de la API.
- Evita duplicar validaciones idénticas si pueden centralizarse sin perder claridad.
- No aceptes propiedades inesperadas cuando la configuración de validación permita rechazarlas de forma segura.
- Mantén las conversiones y normalizaciones explícitas.

## API y contratos

- Mantén el prefijo `/api` previsto en el README, salvo que una decisión documentada indique lo contrario.
- Usa nombres de rutas y recursos coherentes, preferiblemente en plural y con una convención uniforme.
- Usa códigos HTTP apropiados y respuestas predecibles.
- Define contratos de entrada y salida claros; no expongas automáticamente objetos internos de persistencia.
- Mantén la lógica de negocio fuera de los controladores.
- Considera paginación y filtros cuando un historial pueda crecer; no agregues parámetros innecesarios sin un caso de uso.
- Si cambias un contrato consumido por el frontend, documenta el cambio y sus consecuencias.
- Si se incorpora documentación OpenAPI/Swagger, mantenla alineada con los DTOs y endpoints reales.

## Configuración y secretos

- Centraliza la lectura de variables de entorno.
- Valida la configuración al iniciar la aplicación.
- Actualiza `.env.example` cuando se añadan variables nuevas, usando valores ilustrativos no sensibles.
- Nunca escribas secretos, tokens, contraseñas o datos personales reales en el código, commits, logs o pruebas.
- No supongas nombres de variables de base de datos o autenticación antes de decidir la tecnología correspondiente.
- Mantén la configuración específica de desarrollo y producción fuera del código de negocio.

## Persistencia

La tecnología de base de datos y ORM todavía debe confirmarse.

Antes de añadir persistencia:
1. Inspecciona las dependencias y decisiones existentes.
2. Confirma la tecnología y documenta la decisión.
3. Define modelos, restricciones y relaciones según requisitos reales.
4. Usa migraciones versionadas si la herramienta elegida las soporta.
5. Mantén el acceso a datos fuera de los controladores.
6. No crees un repositorio genérico por defecto; evalúa si una abstracción aporta valor al dominio o a las pruebas.
7. Considera integridad, fechas, unidades y duplicados de acuerdo con los requisitos.

No simules que los datos son persistentes si solo se almacenan en memoria.

## Seguridad y privacidad

Los datos registrados pueden revelar información personal relacionada con la salud y los hábitos.

- Devuelve únicamente los datos necesarios para cada caso de uso.
- Evita registrar cuerpos de solicitudes, datos sensibles o información personal innecesaria.
- No devuelvas stack traces, consultas SQL ni detalles internos en respuestas de producción.
- Configura CORS para los orígenes requeridos; no uses una política abierta indiscriminadamente en producción.
- Valida entradas y maneja errores de forma consistente.
- No implementes autenticación ficticia. Si se necesita autenticación o autorización, documenta y desarrolla una solución real acorde con los requisitos.
- No incluyas datos personales reales en fixtures, snapshots o pruebas.
- No afirmes cumplimiento normativo sin una revisión específica.

## Errores y observabilidad

- Usa excepciones HTTP apropiadas o un mecanismo común cuando aporte consistencia.
- No captures errores para ignorarlos ni devuelvas éxito cuando una operación falló.
- Mantén los mensajes para clientes claros y evita filtrar detalles internos.
- Registra información técnica útil sin incluir secretos ni datos sensibles.
- Añade filtros, interceptores o middleware globales solo cuando resuelvan una necesidad transversal.

## Pruebas y verificación

- Añade pruebas unitarias para reglas de negocio y servicios.
- Añade pruebas e2e para endpoints y flujos relevantes.
- Aísla dependencias externas en pruebas cuando sea apropiado.
- Prueba escenarios válidos, entradas inválidas y errores relevantes.
- No modifiques ni elimines pruebas únicamente para hacer que el build pase.
- Ejecuta las pruebas, el lint, la comprobación de tipos y el build disponibles antes de dar por terminado un cambio.
- Informa qué comandos ejecutaste y cuáles no pudiste ejecutar. Nunca afirmes que algo pasó si no lo verificaste.

## Dependencias y cambios

- Antes de añadir una dependencia, comprueba si el framework o las librerías existentes ya resuelven la necesidad.
- Evita dependencias redundantes y paquetes que agreguen más complejidad que valor.
- No actualices paquetes de forma masiva como parte de una tarea no relacionada.
- No cambies scripts, configuración de compilación o versiones de runtime sin motivo concreto.
- Mantén los cambios pequeños y enfocados en el objetivo solicitado.

## Convenciones Git

- La autoría de los commits debe ser única y exclusivamente **JustLearningMX**. NUNCA agregues coautoría (`Co-authored-by`), atribución secundaria ni mención a otros colaboradores o asistentes.
- Usa mensajes de commit claros, concisos y en imperativo.
- Mantén los commits atómicos.
- `main` contiene exclusivamente las liberaciones de versiones estables.
- `develop` es la rama base de integración para los cambios aprobados de las features.
- Crea ramas de trabajo desde `develop`:
  - `feat/<descripcion>`
  - `fix/<descripcion>`
  - `refactor/<descripcion>`
  - `chore/<descripcion>`
- Integra las ramas terminadas mediante pull request hacia `develop`.
- No crees commits, ramas ni pull requests salvo que el usuario lo solicite o el flujo de trabajo lo requiera explícitamente.

## Flujo de trabajo del agente

Para cada tarea:

1. Identifica el requisito y el comportamiento esperado.
2. Inspecciona los módulos, contratos y pruebas afectados.
3. Propón la solución más simple que respete la arquitectura existente.
4. Implementa el cambio con tipos y validaciones apropiados.
5. Añade o actualiza pruebas.
6. Ejecuta las verificaciones disponibles.
7. Revisa el diff para detectar cambios no relacionados, secretos, duplicación y complejidad innecesaria.
8. Resume los cambios y declara claramente cualquier prueba pendiente o decisión que siga abierta.

Si faltan requisitos importantes, no inventes una decisión irreversible. Implementa solo lo que esté determinado o pregunta cuando el dato pendiente impida avanzar correctamente.

## Criterio de finalización

Un cambio está listo cuando:

- Cumple el requisito solicitado.
- Respeta la separación de responsabilidades.
- Incluye validaciones y pruebas apropiadas.
- No introduce secretos ni datos personales reales.
- No añade complejidad innecesaria.
- Las verificaciones se ejecutaron o sus limitaciones quedaron explícitas.
- La documentación afectada está actualizada.
