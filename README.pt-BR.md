# AI Website Generator

[![CI](https://github.com/RamonRDR/ai-website-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/RamonRDR/ai-website-generator/actions/workflows/ci.yml) · [Licença MIT](LICENSE) · [English](README.md) · [Español](README.es.md)

Aplicação full-stack em Next.js e TypeScript para transformar descrições em **estruturas de websites validadas**, com visualização responsiva, editor, histórico local e exportação ZIP.

> O **modo demo é determinístico** e não executa inteligência artificial real. A integração LLM é opcional e exige configuração explícita de uma API potencialmente paga.

## Recursos disponíveis

- Descrição em linguagem natural, nome, objetivo, público-alvo, idioma, categoria e tema.
- Sete tipos de site: empresarial, portfólio, institucional, produto, serviços, evento e restaurante.
- Schema Zod versionado com catálogo fechado: header, hero, features, about, services, pricing, testimonials, faq, cta, contact e footer.
- Quatro temas: Ocean, Sunset, Forest e Mono, com cores hexadecimais editáveis.
- Preview desktop e mobile (390px) em iframe sandboxed, sem scripts gerados.
- Edição de títulos, descrições, botões, links, cartões, visibilidade, ordem, inclusão e remoção de seções.
- Regeneração limitada à seção selecionada, com aceite ou rejeição da proposta.
- Até 15 checkpoints armazenados localmente com restauração.
- Exportação ZIP de `index.html`, `styles.css`, `metadata.json` e `README.md`.
- Adaptador opcional para LLM via servidor, com resposta estruturada e validação Zod.
- Vitest, React Testing Library, Playwright e GitHub Actions sem consumir API paga.

## Instalação e uso

Requer Node.js 22.12+ (recomendado 24) e npm.

```bash
git clone https://github.com/RamonRDR/ai-website-generator.git
cd ai-website-generator
npm install
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000, selecione **Demo · Free, deterministic**, descreva o site e clique em **Generate website**. Edite os componentes, salve versões e exporte um ZIP. Não é necessário banco de dados nem backend adicional.

## IA real, somente com autorização

O modo ao vivo permanece desabilitado por padrão. Para habilitar intencionalmente no servidor, configure `LLM_ENABLED=true`, `LLM_API_KEY` e `LLM_MODEL` em `.env.local`. O adaptador utiliza o endpoint oficial de chat completions da OpenAI e exige modelo compatível com `json_schema`. Nunca coloque a chave em variáveis `NEXT_PUBLIC_*`.

Em produção também seria necessária a configuração explícita `LLM_ALLOW_PRODUCTION=true`. **Este MVP não possui autenticação nem limitação pública de requisições. Não disponibilize geração paga publicamente sem controles de acesso, quotas e rate limiting.** Nenhum teste automatizado chama LLM real.

## Arquitetura e segurança

Interface Next.js → rotas API → demo determinístico ou adaptador LLM → validação Zod → JSON estruturado → renderer HTML seguro → preview isolado, editor, histórico local e exportação ZIP. O modelo é tratado como fonte não confiável. Não usamos `eval`, HTML arbitrário, scripts gerados nem publicação automática.

Links, URLs de imagens, paletas, tamanho de prompts, seções, schemas e caminhos exportados são restritos. A exportação contém apenas HTML/CSS estático, e o resultado precisa ser revisado antes da publicação. O armazenamento não sincroniza dispositivos.

## Testes e documentação

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

Os 20 prompts sintéticos são avaliações **determinísticas**, não métricas de acurácia de LLM real. O badge de CI reflete o resultado efetivo do GitHub Actions.

Consulte [arquitetura](docs/architecture.md), [schemas](docs/SCHEMA.md), [segurança](docs/SECURITY.md), [testes](docs/TESTING.md), [avaliação](docs/EVALUATION.md), [prompts](docs/PROMPTS.md), [exportação](docs/EXPORT.md) e [decisões](docs/DECISIONS.md).

## Limitações

MVP com edição por formulários, não drag-and-drop; histórico apenas no navegador; sem multiusuário, login, pagamentos ou deploy automático. A exportação não cria um projeto Next.js. O modo demo utiliza exemplos fictícios, e a IA real depende de configuração e custos externos. Não afirmamos conformidade integral com WCAG, resultados de LLM real, capturas de tela ou URL de deploy não existentes.

**Licença:** [MIT](LICENSE) © 2026 Ramon Rodriguez.
