# Contextos delimitados, módulos e agregados

Os módulos abaixo vivem no backend inicialmente. Cada um terá `entity/` puro e features verticais;
dependências entre módulos ocorrem por portas de aplicação e IDs, nunca por ORM compartilhado.

| Módulo | Agregado raiz / entidades | Responsabilidade neste requisito |
|---|---|---|
| `tenant` | `Tenant`, `OwnerAppointment`, `TenantOnboardingRequest` | Conta isolada, ciclo de vida, propriedade e idempotência de onboarding. |
| `identity` | `Identity`, `Credential` | Sujeito humano, serviço, dispositivo ou agente e metadados da credencial externa. |
| `membership` | `TenantMember`, `MemberInvitation` | Vínculo de uma identidade ao tenant, fonte de vínculo, patrocínio e aceitação. |
| `access-governance` | `RoleDefinition`, `RoleRevision`, `AccessPolicyRevision`, `AccessRequest`, `AccessGrant` | Catálogo, papéis, políticas, pedido, concessão, revisão e decisão contextual. |
| `operational-topology` | `OperationalNode` | Hierarquia tenant → site → área → linha → célula/centro → ativo. |
| `competency` | `CompetencyEvidence` | Evidência de capacitação válida; não é um LMS completo. |
| `work-schedule` | `ShiftTemplate`, `ShiftOccurrence` | Turno aplicável ao escopo; não planeja produção. |
| `asset-assignment` | `AssetAssignment` | Designação de pessoa a ativo para operar, setup, manutenção, inspeção ou supervisão. |
| `delegation` | `Delegation` | Transferência temporária e finita de atos de uma concessão delegável. |
| `emergency-access` | `EmergencyAccess` | Exceção mínima, curta, aprovada e com revisão obrigatória. |
| `audit-trail` | `AuditEvent` | Evidência imutável de decisão, mudança e ação relevante. |

## Relações deliberadas

```text
Identity ──< TenantMember >── Tenant ──< OwnerAppointment
TenantMember ──< AccessGrant >── RoleRevision ── RoleDefinition
AccessGrant ──< ScopeSelector >── OperationalNode
TenantMember ──< CompetencyEvidence / AssetAssignment / Delegation
AuthorizationDecision ──> AuditEvent
```

`TenantMember` é o sujeito de autorização dentro de um tenant. Portanto, a mesma `Identity`
pode ter membros, papéis e escopos totalmente independentes em A e B. O catálogo global de
permissões contém somente metadados de produto; qualquer entidade de negócio contém `tenantId`.

## Invariantes e fronteiras de transação

- `Tenant` + nomeação inicial de Owner + membro pendente são gravados em uma transação local de onboarding.
- A criação de convite no Keycloak é assíncrona via outbox idempotente; tenant permanece pendente até aceite.
- Ativar, suspender ou remover Owner bloqueia a linha do tenant e verifica que restará ao menos um Owner ativo.
- Um `AccessGrant` referencia revisão publicada e imutável de papel; alteração exige nova concessão/migração explícita.
- Uma `Delegation` deriva de uma concessão fonte ainda válida e só pode reduzir permissões, escopo e vigência.
- `AuditEvent` não é atualizado nem removido pelo aplicativo; retenção e WORM físico são evolução de plataforma.

## Contextos simplificados, mas suficientes

Topologia, competência, turno e designação só fornecem contexto verificável à autorização agora.
Seus futuros domínios podem crescer sem mudar uma concessão: mantêm os mesmos IDs e publicam mudanças
que invalidam a próxima avaliação. Ordem, lote, HMI, integração e ativo específico deverão expor um
`ResourceContext` próprio ao avaliador, preservando versão e estado do fato histórico.
