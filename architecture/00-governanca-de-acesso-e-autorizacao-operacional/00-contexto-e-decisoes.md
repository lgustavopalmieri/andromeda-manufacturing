# Arquitetura — governança de acesso e autorização operacional

## Objetivo e limites

Esta proposta implementa o requisito de produto `01-governanca-de-acesso-e-autorizacao-operacional`.
O núcleo é criar uma conta isolada, manter seu Owner e decidir acesso granular a cada ação.
Módulos operacionais futuros entram como recursos protegidos; não são implementados neste requisito.

## Decisões arquiteturais

| Decisão | Consequência |
|---|---|
| `tenantId` é obrigatório em todo dado pertencente a tenant | Leituras e mutações sempre filtram por tenant; um ID direto de outro tenant não revela existência. |
| Keycloak autentica; Andromeda autoriza | O token traz o sujeito autenticado, não permissões efetivas nem escopos operacionais. |
| Um realm compartilhado do produto | A mesma pessoa pode selecionar tenants distintos sem duplicar usuário; o vínculo local determina o contexto ativo. |
| Decisão contextual por ação | Papel, escopo, vigência, estado, competência, designação, segregação e bloqueios são reavaliados antes do efeito. |
| Revisões publicadas são imutáveis | Alterar um papel ou política cria nova revisão; concessões existentes nunca ganham poder silenciosamente. |
| Fatos e auditoria são append-only | Revogação bloqueia atos futuros, mas não apaga autoria, contexto ou decisão anterior. |
| PostgreSQL é a fonte de autorização | Não há cache permissivo no MVP; isso torna suspensão e revogação eficazes mesmo em sessão aberta. |

`Identity` e o catálogo de permissões são registros globais de plataforma, sem recurso ou dado de
negócio do tenant. Eles só são observáveis em contexto de tenant por meio de `TenantMember`.

## Fluxo de uma ação protegida

```text
Bearer token → middleware Keycloak → identidade autenticada
seleção de tenant + recurso → contexto do recurso → avaliador contextual
grants/política/condições/histórico → permitir ou negar → efeito + auditoria
```

O cliente pode sugerir o tenant ativo, mas ele é válido somente após encontrar vínculo ativo para
a identidade autenticada. Toda busca de recurso usa `tenantId` como predicado, inclusive antes da
autorização detalhada. `404` e negação não distinguem recursos de outro tenant.

## Não objetivos desta entrega

- substituir PLC, DCS, SIS ou procedimento de emergência físico;
- modelar profundamente receita, ordem, qualidade, manutenção, material ou telemetria;
- armazenar senha, segredo de cliente ou token de integração no banco da aplicação;
- conceder ato operacional por ser Owner, gestor, líder, identidade de serviço ou agente.

## Regras que a solução preserva

- Owner ativo é obrigatório para tenant operacional ativo; transferências nunca deixam intervalo sem Owner.
- Ausência de permissão, de escopo ou de condição necessária resulta em negação.
- Uma integração, dispositivo ou agente usa identidade própria e privilégio mínimo.
- Uma confirmação de autorização não é reutilizável depois de revogação, mudança de estado ou expiração.
