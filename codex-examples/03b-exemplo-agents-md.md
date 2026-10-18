# 03b · Exemplo completo de `AGENTS.md` para o SolarFleet OS

> Material de apoio do [capítulo 03](03-agents-md.md). Copie apenas o
> que for verdade no seu repositório; comandos e caminhos são exemplos fictícios.

## `AGENTS.md` (raiz)

```markdown
# SolarFleet OS — instruções de repositório

## Produto

SolarFleet OS é uma plataforma white-label para monitorar e controlar inversores
solares em Linux embarcado. A IHM Angular consome telemetria e alarmes por SSE. O
backend FastAPI autentica o usuário, aplica isolamento por tenant e traduz comandos
autorizados para os serviços locais via D-Bus.

## Invariantes que nunca podem quebrar

- O frontend nunca acessa D-Bus, socket local ou driver do inversor diretamente.
- Todo evento exposto por SSE contém `tenant_id`, `device_id`, `sequence` e
  `occurred_at`; não envie segredos, payload bruto de D-Bus ou PII para o browser.
- Todo comando ao inversor exige autorização por tenant/dispositivo, correlação e
  auditoria; uma repetição não pode produzir dois efeitos físicos.
- O backend não pode bloquear o loop de eventos esperando I/O de D-Bus.
- Tema/configuração white-label não pode permitir acesso a dados de outro tenant.
- Mudanças em proteção elétrica, rede, OTA ou certificados exigem plano, aprovação
  humana explícita e revisão antes de qualquer ação externa.

## Layout

- `frontend/`: IHM Angular em feature slices (`core/`, `shared/`, `features/<slice>/`).
- `backend/`: FastAPI em vertical slices (`core/`, `shared/`, `modules/<slice>/`).
- `device/`: integração Linux embarcado, D-Bus e simulador de inversor.
- `contracts/`: contratos versionados de REST, SSE e mensagens D-Bus.
- `docs/decisoes/`: ADRs e investigações; `harness/build/`: specs de fases aprovadas.

## Regras compartilhadas

- Altere contratos em `contracts/` antes de alterar produtor ou consumidor.
- Mantenha compatibilidade de eventos SSE ou documente a migração/versionamento.
- Prefira dados tipados e unidades explícitas (`voltage_v`, `power_w`, `energy_wh`);
  não converta unidade silenciosamente na borda.
- Todo bug corrigido deve ganhar teste de regressão no componente mais próximo da
  causa-raiz.
- Não inclua segredos em código, logs, fixtures, prompts ou documentação.

## Comandos canônicos

- Backend: `uv run pytest -q`, `uv run ruff check backend`, `uv run mypy backend`.
- Frontend: `npm --prefix frontend run test -- --runInBand`,
  `npm --prefix frontend run lint`, `npm --prefix frontend run build`.
- Contratos: `npm --prefix contracts run validate`.
- Antes de concluir, execute somente os checks afetados e informe exatamente quais
  passaram, quais não foram executados e por quê.

## Fluxo seguro

Para mudança não trivial, apresente um plano curto e pare para aprovação antes de
editar. Preserve o escopo aprovado, faça diffs pequenos e não crie commit, push,
deploy, migração destrutiva nem comando no dispositivo sem autorização explícita.

## Code Review Rules

- Rejeite evento SSE sem `tenant_id`, `device_id` e `sequence`, ou que exponha
  payload bruto de D-Bus, segredo ou PII. Caminho seguro: validar no publicador.
- Sinalize comando ao inversor sem autorização por tenant/dispositivo, correlação,
  auditoria ou idempotência.
- Sinalize chamada D-Bus sem timeout e cancelamento.
- Sinalize dinheiro/energia/tensão sem unidade explícita no nome do campo.
```

## `backend/AGENTS.md`

O backend é organizado em **vertical slices**: um módulo por capacidade de negócio,
com `core/` para preocupações transversais e `shared/` para tipos sem regra de negócio.

```text
backend/
├── src/solarfleet/
│   ├── main.py                 # cria o app e monta o router de cada módulo
│   ├── core/                   # transversal: config, auth, tenancy, sse, observabilidade, erros
│   ├── shared/                 # tipos/utilidades sem domínio (unidades, Result, paginação)
│   └── modules/                # VERTICAL SLICES — um por capacidade
│       ├── telemetry/
│       │   ├── api.py          # router FastAPI do slice (valida + autoriza + delega)
│       │   ├── schemas.py      # Pydantic de entrada/saída do slice
│       │   ├── service.py      # regra de domínio do slice (não conhece FastAPI nem D-Bus)
│       │   ├── events.py       # publicação SSE do slice
│       │   └── adapters/       # dbus/ e repo/ — única fronteira de I/O do slice
│       ├── commands/           # mesma forma: api / schemas / service / adapters
│       ├── alarms/
│       └── devices/
└── tests/                      # espelha modules/<slice>/
```

```markdown
# Backend — FastAPI em vertical slices, D-Bus e SSE

## Arquitetura

- Cada capacidade vive em `src/solarfleet/modules/<slice>/` e é autossuficiente:
  `api.py` (router) → `service.py` (domínio) → `adapters/` (I/O). O fluxo de
  dependência só desce; `service.py` não importa FastAPI nem D-Bus.
- **Slices não importam internals de outros slices.** Integração cruzada passa por um
  contrato em `contracts/`, por um evento, ou por uma interface exposta em `core/`.
- `core/` concentra o transversal (auth, tenancy, infra de SSE, observabilidade) e
  **não depende** de `modules/`. `shared/` tem só tipos/utilidades sem regra de negócio.
- Só `modules/<slice>/adapters/dbus/` conhece nomes de serviço, paths e métodos D-Bus.

## Regras do slice

- `api.py` valida entrada, extrai identidade/tenant e delega ao `service`; não chama
  D-Bus nem monta query direto.
- Sempre defina timeout, cancelamento e mapeamento de erro para chamada D-Bus/rede.
- `events.py` só emite SSE validado pelo schema em `contracts/`; respeite ordem por
  `device_id` e use `sequence` para reconexão.
- Feature nova nasce como slice novo (ou estende um existente); não espalhe regra por
  camadas técnicas globais.
- Logs estruturados com `request_id`, `tenant_id` e `device_id`; nunca logue token,
  certificado, payload diagnóstico bruto ou PII.
- Teste no nível do slice (`tests/<slice>/`): unidade do `service`, contrato do `api`
  e borda do `adapter` com D-Bus simulado.
```

## `frontend/AGENTS.md`

A IHM Angular segue **feature slices**: `core/` (singletons), `shared/` (UI
apresentacional) e cada capacidade em `features/<slice>/`, lazy-loaded e isolada.

```text
frontend/src/app/
├── core/                       # singletons: auth, tenant, cliente SSE, interceptors, guards
├── shared/                     # UI "burra": componentes, pipes, diretivas, tokens da marca
├── features/                   # VERTICAL SLICES por capacidade (lazy-loaded)
│   ├── telemetry/
│   │   ├── telemetry.routes.ts # rota lazy do slice
│   │   ├── data-access/        # services tipados + estado (SSE/REST) do slice
│   │   ├── ui/                 # componentes de apresentação (dumb) do slice
│   │   └── feature/            # containers (smart) do slice
│   ├── commands/
│   └── alarms/
└── app.routes.ts               # rotas raiz com lazy load de cada feature
```

```markdown
# Frontend — Angular em feature slices, TypeScript e Jest

## Arquitetura

- Cada capacidade vive em `src/app/features/<slice>/`, lazy-loaded por `*.routes.ts`
  e dividida em `feature/` (containers smart), `ui/` (apresentação dumb) e
  `data-access/` (services tipados + estado).
- **Uma feature não importa de outra feature.** O que for compartilhado sobe para
  `shared/` (apresentacional, sem domínio) ou `core/` (singletons: auth, tenant, SSE).
- Componentes são standalone; `core` é provido uma vez na raiz; `shared` não conhece
  regra de negócio nem faz I/O.

## Regras do slice

- Componentes ficam apresentacionais sempre que possível; todo acesso REST/SSE vive
  em `data-access/`, tipado pelos contratos de `contracts/` — nunca `any`.
- O estado de telemetria trata reconnect, evento fora de ordem e dispositivo offline
  sem inventar leitura; valor ausente é estado explícito, não `0`.
- White-label muda apresentação (tokens/tema em `shared/`), nunca autorização,
  contrato ou regra de negócio.
- Em Jest, cubra por slice: unidade do componente, dado ausente, erro, reconexão SSE
  e permissão quando o fluxo os tiver.
```

## `~/.codex/AGENTS.md` (global, pessoal — opcional)

> Não vai no repositório. Fica na sua home e molda como o Codex fala com **você**,
> em qualquer projeto. O `AGENTS.md` do repositório sempre prevalece sobre ele.

```markdown
# Minhas preferências de trabalho

- Antes de editar, mostre um plano curto em bullets e espere meu "ok".
- Explique decisões em português, de forma objetiva, sem encher de preâmbulo.
- Rode os checks afetados antes de dizer que terminou e cole a saída relevante.
- Ao corrigir algo que você assumiu errado, sugira a regra para eu colar no
  `AGENTS.md` do projeto.
```

> 💡 Para um ajuste temporário sem apagar a base, crie `~/.codex/AGENTS.override.md`;
> ele tem prioridade sobre o `~/.codex/AGENTS.md`. Remova o override para voltar ao
> padrão.

<p align="center"><a href="03-agents-md.md">⬅️ Voltar ao capítulo 03</a></p>
