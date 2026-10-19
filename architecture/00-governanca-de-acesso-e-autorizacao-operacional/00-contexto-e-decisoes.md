# Governança de acesso e autorização operacional — contexto e decisões

> Esta pasta é uma **spec de implementação backend** do requisito de produto. Ela transforma
> regras de negócio em módulos, entidades TypeScript, invariantes, features e verificações; não
> substitui a decisão de produto. Quando houver conflito, o produto prevalece e a spec deve mudar.

## Como ler esta spec

1. Este arquivo fixa fontes, escopo e decisões transversais.
2. [01](01-contextos-delimitados-e-agregados.md) identifica o módulo responsável; [02](02-contratos-compartilhados-de-autorizacao.md) define a linguagem compartilhada.
3. Os arquivos [03–10](03-entidades-tenant.md) detalham, por módulo, papel no requisito, rastreabilidade,
   entidades, regras e features. [11](11-modelo-de-decisao-contextual.md) mostra como elas decidem juntas.
4. [12](12-features-e-ordem-de-implementacao.md) é a ordem executável; [13](13-consistencia-persistencia-e-validacao.md) define persistência e testes.

## Fontes normativas do requisito

| Fonte de produto | Obrigação técnica que deriva dela |
|---|---|
| [P00 — visão e fronteiras](../../product/01-governanca-de-acesso-e-autorizacao-operacional/00-visao-e-fronteiras.md) | Isolamento por tenant, hierarquia física, contratos HMI versionados e nenhum controle físico. |
| [P01 — personas](../../product/01-governanca-de-acesso-e-autorizacao-operacional/01-personas-papeis-e-responsabilidades.md) | Persona não concede acesso; Owner não é operador implícito. |
| [P02 — decisão contextual](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md) | Permissão, escopo, estado e condições são cumulativos; ausência nega. |
| [P03 — onboarding e Owner](../../product/01-governanca-de-acesso-e-autorizacao-operacional/03-onboarding-do-tenant-e-owner.md) | Tenant isolado, convite rastreável, ativação controlada e continuidade de Owner. |
| [P04 — catálogo](../../product/01-governanca-de-acesso-e-autorizacao-operacional/04-catalogo-de-permissoes-e-papeis.md) | Operações de negócio explícitas e papéis como presets revisáveis. |
| [P05 — atribuições e ativos](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md) | Concessão declarativa, escopo mínimo, vigência e condições para atuar em ativo. |
| [P06 — estado e segregação](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md) | Estado, SoD e pré-condições prevalecem sobre papel e produtividade. |
| [P07 — identidade, exceção e auditoria](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md) | Identidade própria, delegação finita, exceção curta e trilha imutável. |
| [P08 — cenários de aceitação](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md) | Quinze fluxos mínimos que guiam testes E2E e de segurança. |
| [P09 — ciclo de colaboradores](../../product/01-governanca-de-acesso-e-autorizacao-operacional/09-governanca-do-ciclo-de-vida-de-colaboradores.md) | Vínculo, patrocínio, aprovação, provisionamento e designação são atos separados. |
| [P10 — critérios de ciclo de vida](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md) | Início, mudança, cobertura, desligamento e revisão devem ser verificáveis. |

## Resultado que esta arquitetura deve produzir

Uma identidade autenticada seleciona um tenant e só vê ou altera um recurso quando uma decisão
atual comprova: vínculo ativo, operação exata, escopo aplicável, vigência, estado, condições
operacionais e ausência de conflito. Isso permite a operadora de E-03/B sem conceder E-04, e
permite ao Owner governar a conta sem abrir uma HMI — os exemplos centrais de [P00](../../product/01-governanca-de-acesso-e-autorizacao-operacional/00-visao-e-fronteiras.md) e [P08](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md).

## Decisões arquiteturais vinculantes

| Decisão | Regra de implementação e consequência |
|---|---|
| `tenantId` é fronteira | Todo dado de negócio, leitura e mutação filtra `tenantId`; IDs estrangeiros não confirmam existência. |
| Keycloak autentica | O edge valida o token e obtém o sujeito; o token não é fonte de papel, escopo ou concessão efetiva. |
| Andromeda autoriza | A application reavalia autorização contextual antes do efeito, para HTTP, HMI, integração e agente. |
| `TenantMember` é o sujeito local | A mesma `Identity` pode ter vínculos e poderes independentes em cada tenant. |
| Papéis e políticas são versionados | Uma revisão publicada é imutável; migração de concessão é explícita e auditável. |
| Owner é governança, não exceção | Ter nomeação de Owner não satisfaz condições de operação, qualidade, manutenção ou SoD. |
| Auditoria é fato, não log mutável | Mudança, decisão relevante e ato sensível preservam autor efetivo, contexto e correlação. |
| Fonte de verdade é PostgreSQL | No MVP não há cache permissivo; suspensão/revogação bloqueia a próxima ação mesmo com sessão aberta. |
| Bootstrap pré-tenant é allowlist | Só onboarding público cria `TenantOnboardingRequest` sem `tenantId`, com correlação e ator de sistema; toda escrita tenant-scoped exige `tenantId`. |

## Limites deliberados desta primeira entrega

Topologia, competência, turno e designação nascem simplificados: existem para provar ou negar
condições de acesso, não para substituir MES, LMS, planejamento ou manutenção. Ordem, qualidade,
material, HMI, telemetria e integrações futuros devem fornecer seu próprio `ResourceContext`, sem
alterar uma concessão já emitida. PLC, DCS, SIS e procedimento físico de emergência permanecem
fora do sistema, conforme [P00](../../product/01-governanca-de-acesso-e-autorizacao-operacional/00-visao-e-fronteiras.md) e [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md).

## Fluxo canônico de um ato protegido

```text
token Keycloak → identidade autenticada → tenant/membro ativo → recurso filtrado por tenant
→ decisão contextual (grant + escopo + condições + SoD) → efeito atômico + auditoria + outbox
```

Uma confirmação ou decisão permitida não é reutilizável: revogação, expiração, mudança de estado,
competência, designação ou contexto exige nova avaliação. As regras e a sequência precisa estão em
[11](11-modelo-de-decisao-contextual.md).
