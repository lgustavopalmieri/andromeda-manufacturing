# Features necessárias e ordem de implementação

Cada item seguirá `entity → domain → application → outbound → inbound → wire`, conforme o padrão
do backend. Os nomes abaixo são features semânticas, não controladores CRUD genéricos.

| Fase | Módulos / features | Resultado verificável |
|---|---|---|
| 0 | `@shared/access`, autenticação Keycloak, banco, migrações, correlação, outbox e `audit-trail/record-event` | Token é validado, identidade é propagada, auditoria e evento podem ser atômicos. |
| 1 | `access-governance/bootstrap-catalog`; `tenant/request-onboarding`, `provision-owner-invitation`, `activate-tenant` | Solicitação idempotente cria tenant pendente, política/papéis neutros e Owner rastreável. |
| 2 | `identity/resolve-identity`; `membership/register-member`, `invite-member`, `accept-invitation`, `suspend-member`, `revoke-member`; `tenant/appoint-owner`, `transfer-owner`, `suspend-tenant` | Só membro ativo atua; último Owner não pode sair; vínculo RH/contrato é rastreável. |
| 3 | `access-governance/define-role`, `publish-role-revision`, `propose-access`, `decide-access-request`, `grant-access`, `suspend-grant`, `revoke-grant`, `evaluate-access` | Papéis e permissões exatas funcionam no escopo tenant, sem direito operacional implícito. |
| 4 | `operational-topology/register-node`, `move-node`, `inactivate-node`; resolução de escopo descendente | Site, linha e ativo restringem listagem e ação; mudança de ativo preserva histórico. |
| 5 | `competency/validate-evidence`; `work-schedule/define-shift`, `materialize-occurrence`; `asset-assignment/assign-asset`, `end-assignment` | Operação de ativo requer, quando configurado, turno, competência e designação válidos. |
| 6 | `delegation/create`, `accept`, `revoke`; `emergency-access/authorize`, `revoke`, `review`; `access-governance/review-grants` | Cobertura temporária, agente e elevação emergencial expiram e deixam trilha. |
| 7 | Adaptadores de contexto em HMI, ordem, qualidade, manutenção, material e integração | Todos os canais usam a mesma decisão antes de revelar ou mudar recurso. |

## Dependências de implementação importantes

- A fase 0 é pré-requisito de toda escrita: não criar endpoints administrativos sem auditoria e tenant context.
- A fase 1 pode expor somente onboarding público e ativação do Owner convidado; não expõe operação.
- A fase 3 implementa inicialmente escopo de tenant. A fase 4 estende a mesma entidade de grant para árvore física.
- A fase 5 vem antes de liberar HMI/manutenção reais; não simular competência por papel.
- Fases 6 e 7 não substituem a reavaliação da fase 3; elas adicionam fontes de autoridade e contexto.

## Estrutura de feature esperada

```text
modules/access-governance/
  entity/{permission,role,policy,access-request,access-grant}.ts
  features/grant-access/{domain,application,inbound/http,outbound/typeorm}/
modules/tenant/features/request-onboarding/{domain,application,inbound/http,outbound/typeorm}/
modules/@shared/access/{authorization.types,contextual-authorized-usecase}.ts
```

Interfaces de repositório, Keycloak, clock, transação, outbox e contexto de recurso pertencem a
`application/interfaces.ts`; implementações TypeORM/Keycloak pertencem a `outbound/` e são ligadas
somente pelo `wire`. Isto preserva domínio puro e testes unitários sem banco ou IdP.
