# 05b · Exemplos completos de Skills — SolarFleet OS

> Material de apoio do [capítulo 05](05-skills.md). A Skill de projeto mora em
> `.agents/skills/`. Plugin é só a embalagem de distribuição. Substitua comandos,
> versões e contratos pelos que existem no seu produto.

## Layout no repositório

```text
.agents/skills/
├── adicionar-telemetria-sse/
│   ├── SKILL.md
│   ├── references/
│   │   ├── contrato-de-evento.md
│   │   └── politica-de-unidades.md
│   ├── templates/
│   │   ├── event.schema.json
│   │   └── metric-card.component.spec.ts
│   ├── scripts/
│   │   └── validate_contract.sh
│   └── agents/
│       └── openai.yaml
└── teste-regressao-alarme/
    └── SKILL.md
```

## `.agents/skills/adicionar-telemetria-sse/SKILL.md`

```markdown
---
name: adicionar-telemetria-sse
description:
  Adiciona uma métrica do inversor até a IHM Angular por contrato, D-Bus,
  FastAPI e SSE. Use para "nova métrica", "telemetria", "evento SSE", "campo do
  inversor" ou "card de monitoramento".
---

# Adicionar telemetria ponta a ponta

## Antes de começar

- Leia os `AGENTS.md` aplicáveis e o ADR do contrato, se existir.
- Não invente unidade, precisão ou comportamento quando o dispositivo estiver offline.
- Não contorne a fronteira FastAPI ↔ adaptador D-Bus nem faça o frontend falar D-Bus.

## Procedimento

1. Especifique em `contracts/telemetry/` o nome, tipo, unidade, intervalo esperado,
   nulabilidade e versão de compatibilidade do campo.
2. No adaptador D-Bus, converta o sinal do serviço embarcado para o modelo interno;
   defina timeout, validação e erro de transporte.
3. No serviço FastAPI, valide tenant/dispositivo e publique evento SSE contendo
   `tenant_id`, `device_id`, `sequence`, `occurred_at` e o payload tipado.
4. No Angular, atualize o service de SSE e o view-model. Mostre estado indisponível
   para valor ausente, evento antigo ou dispositivo offline; não replique leitura velha.
5. Atualize testes de contrato, pytest e Jest. Inclua reconexão SSE e evento fora de
   ordem quando o fluxo os suporta.

## Verificação

Rode `bash scripts/validate_contract.sh` e os checks afetados. Reporte o que passou.

## Checklist de pronto

- [ ] Contrato tem unidade, semântica e versão explícitas
- [ ] Nenhuma camada pula autorização/tenant ou acessa D-Bus indevidamente
- [ ] Tempo, sequência e ausência do valor são tratados
- [ ] IHM permanece acessível e respeita o tema white-label
- [ ] Testes e validação de contrato passaram
```

## `.agents/skills/adicionar-telemetria-sse/agents/openai.yaml`

```yaml
interface:
  display_name: "Adicionar telemetria SSE"
  short_description: "contrato → D-Bus → FastAPI → SSE → card Angular"
policy:
  allow_implicit_invocation: true
dependencies:
  tools:
    - type: "mcp"
      value: "docs_inversor"
      description: "Servidor MCP de documentação do SolarFleet OS"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

## `.agents/skills/teste-regressao-alarme/SKILL.md`

```markdown
---
name: teste-regressao-alarme
description:
  Escreve um teste de regressão para alarme ou comando do inversor antes
  de corrigir o bug. Use para "alarme incorreto", "corrigir evento", "regressão",
  "retry", "duplicado" ou "não pode voltar a acontecer".
---

# Teste de regressão para alarme/comando

1. Congele o menor cenário reprodutível no limite da causa: contrato, serviço ou
   componente. Não comece com teste E2E se uma unidade prova o defeito.
2. Faça o teste falhar contra o comportamento atual e nomeie o cenário, por exemplo
   `test_command_retry_does_not_send_two_dbus_calls`.
3. Corrija a causa raiz preservando tenant, auditoria, timeout e a semântica do alarme.
4. Rode o teste novo e a suíte afetada; reporte as evidências.

## Nunca faça

- Não use inversor físico nem credencial real como fixture.
- Não esconda mudança de unidade em dado de teste.
- Não considere a correção pronta sem provar o comportamento de retry/reconexão quando aplicável.
```

## Como invocar

- Explícito, na extensão do VS Code ou no CLI: digite `$adicionar-telemetria-sse` (ou
  `/skills` para escolher na lista).
- Implícito: um pedido como _"preciso expor a temperatura do dissipador no card"_ casa
  com a `description` e o Codex carrega o `SKILL.md` sozinho.

## Desligar uma Skill sem apagá-la

```toml
# ~/.codex/config.toml
[[skills.config]]
path = "/abs/caminho/.agents/skills/teste-regressao-alarme/SKILL.md"
enabled = false
```

## Distribuir como plugin (opcional)

Quando quiser compartilhar estas Skills entre repositórios ou enviá-las junto com um
conector MCP, empacote-as como plugin: um manifesto `.codex-plugin/plugin.json` que
aponta para as pastas de Skills, publicado por um marketplace local
(`.agents/plugins/marketplace.json`) e habilitado no `config.toml`:

```toml
# ~/.codex/config.toml
[marketplaces.solarfleet]
source = "/abs/caminho/para/o/marketplace"   # ou um repositório Git
source_type = "local"

[plugins."solar-inverter-workflows@solarfleet"]
enabled = true
```

> O conteúdo das Skills continua idêntico (`SKILL.md` + pastas). O plugin só muda
> **como elas chegam** a outras máquinas. Consulte a página oficial _Build plugins_
> para o esquema completo do manifesto e do marketplace.

<p align="center"><a href="05-skills.md">⬅️ Voltar ao capítulo 05</a></p>
