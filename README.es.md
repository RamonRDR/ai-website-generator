# AI Website Generator

[![CI](https://github.com/RamonRDR/ai-website-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/RamonRDR/ai-website-generator/actions/workflows/ci.yml) · [Licencia MIT](LICENSE) · [English](README.md) · [Português](README.pt-BR.md)

Aplicación full-stack con Next.js y TypeScript que transforma descripciones en **estructuras de sitios web validadas**, con vista previa adaptable, edición, versiones locales y exportación ZIP.

> El **modo demo es determinista**, no genera contenido mediante un modelo real. La integración LLM es opcional y exige configuración explícita de una API potencialmente de pago.

## Funcionalidades

- Descripción en lenguaje natural, nombre, objetivo, público, idioma, categoría y tema.
- Siete categorías: empresa, portafolio, institucional, producto, servicios, evento y restaurante.
- Schema versionado en Zod y catálogo cerrado: header, hero, features, about, services, pricing, testimonials, faq, cta, contact y footer.
- Cuatro temas: Ocean, Sunset, Forest y Mono, con colores hexadecimales editables.
- Vista previa desktop y móvil (390px) en un iframe aislado, sin scripts generados.
- Editor de títulos, textos, botones, enlaces, tarjetas, visibilidad, orden, inserción y eliminación de secciones.
- Regeneración de una sección, sujeta a aceptación o rechazo.
- Hasta 15 versiones guardadas en este navegador y opción de restauración.
- Exportación ZIP: `index.html`, `styles.css`, `metadata.json` y `README.md`.
- Adaptador LLM opcional en el servidor con JSON estructurado validado por Zod.
- Pruebas Vitest, React Testing Library, Playwright y GitHub Actions sin llamadas pagadas.

## Instalación

Requiere Node.js 22.12+ (recomendado 24) y npm.

```bash
git clone https://github.com/RamonRDR/ai-website-generator.git
cd ai-website-generator
npm install
cp .env.example .env.local
npm run dev
```

Abre http://localhost:3000, utiliza **Demo · Free, deterministic** e introduce la descripción. Después puedes editar, guardar versiones, previsualizar o exportar. No requiere una base de datos ni un backend independiente.

## IA real y costes

El modo de IA real está desactivado por defecto. Para activarlo voluntariamente, configura `LLM_ENABLED=true`, `LLM_API_KEY` y `LLM_MODEL` en el entorno privado del servidor. El adaptador inicial utiliza el endpoint oficial de chat completions de OpenAI y requiere un modelo con soporte `json_schema`. Nunca expongas la clave en variables `NEXT_PUBLIC_*`.

En producción también se exige `LLM_ALLOW_PRODUCTION=true`. **El MVP no incluye autenticación ni límite público de solicitudes. No habilites una API de pago en un despliegue público sin autenticación, cuotas y rate limiting.** Las pruebas y CI no requieren claves ni consumen API.

## Arquitectura y seguridad

Interfaz Next.js → rutas API → demo determinista o adaptador LLM → validación Zod → sitio estructurado → renderer seguro → iframe aislado, editor, historial local y ZIP estático. El contenido del modelo no es confiable. No se ejecuta JavaScript generado, `eval`, HTML arbitrario ni despliegue automático.

Se validan URLs, imágenes HTTPS permitidas, colores, tamaños, tipos de componentes y nombres de archivos. Las versiones se guardan únicamente en el navegador. El contenido exportado requiere revisión humana.

## Calidad y documentación

```bash
npm run lint
npm run typecheck
npm test
npm run evaluate
npm run build
npx playwright install chromium
npm run test:e2e
npm run format:check
```

Los 20 prompts de prueba son evaluaciones **deterministas**, no resultados de un LLM real. El badge de CI muestra el estado auténtico de GitHub Actions.

Documentación adicional: [arquitectura](docs/architecture.md), [schemas](docs/SCHEMA.md), [seguridad](docs/SECURITY.md), [pruebas](docs/TESTING.md), [evaluaciones](docs/EVALUATION.md), [prompts](docs/PROMPTS.md), [exportación](docs/EXPORT.md) y [decisiones](docs/DECISIONS.md).

## Limitaciones

MVP sin drag-and-drop avanzado, sincronización entre dispositivos, multiusuario, autenticación, pagos ni despliegue automático. El ZIP contiene HTML/CSS estático y no un proyecto Next.js. El modo demo usa ejemplos y la IA real necesita credenciales y posibles costes. No se afirma conformidad completa con WCAG ni se inventan capturas o URLs de despliegue.

**Licencia:** [MIT](LICENSE) © 2026 Ramon Rodriguez.
