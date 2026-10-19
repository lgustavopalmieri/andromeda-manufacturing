# Modelo de decisão contextual — spec de integração

> Esta spec integra as entidades e features dos módulos. Ela implementa a decisão cumulativa de
> [P02](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md):
> uma permissão existe somente quando identidade, vínculo, operação, escopo, estado, condição e
> segregação são verdadeiros no instante do ato. Papel, cargo, URL ou token não substituem isso.

## Separação obrigatória: autenticar ≠ autorizar

| Etapa | Dono técnico | Entrada e saída | Proibição |
|---|---|---|---|
| Autenticação | middleware/adaptador em `platform` | Token Keycloak válido → `providerSubjectId`, instante e método | Não decide acesso, não lê roles/scopes efetivos do token. |
| Resolução do sujeito | application de `identity`/`membership` | sujeito autenticado + tenant selecionado → `AuthorizationSubject` | Não aceita `tenantMemberId` do cliente. |
| Autorização contextual | application + porta `ContextualAuthorizationService` | sujeito + operação + `ResourceContext` confiável → decisão/obrigações | Não executa o efeito nem presume que Owner é operador. |
| Regra do recurso | feature dona de HMI, ordem, qualidade etc. | estado/fatos do recurso → pré-condição ou conflito | Não cria/edita grant para resolver uma pré-condição. |
| Efeito e evidência | application da feature + `audit-trail` | decisão permitida → alteração, auditoria e outbox atômicas | Não grava o efeito após `DENY` ou obrigação pendente. |

O contrato entre essas etapas está em [02](02-contratos-compartilhados-de-autorizacao.md). Um canal
MQTT/HMI/agente pode ter outra autenticação, mas chama a mesma porta de autorização; por isso a
regra é consistente entre canais, como exigem [P00](../../product/01-governanca-de-acesso-e-autorizacao-operacional/00-visao-e-fronteiras.md) e [P07](../../product/01-governanca-de-acesso-e-autorizacao-operacional/07-identidades-delegacao-excecao-e-auditoria.md).

## Algoritmo normativo de avaliação

| Ordem | Evidência lida | Regra e dono da evidência |
|---:|---|---|
| 1 | token e `Identity` | Autenticar e resolver a identidade ativa; token inválido/ausente encerra em `401`. [04](04-entidades-identidade-e-vinculo.md) |
| 2 | tenant e `TenantMember` | Selecionar um tenant e exigir vínculo ativo e vigente. Papéis de outro tenant são invisíveis. [04](04-entidades-identidade-e-vinculo.md) |
| 3 | recurso e histórico | Carregar por `tenantId`, formar contexto e fatos de autoria/operação da versão sem confiar no cliente. [02](02-contratos-compartilhados-de-autorizacao.md) |
| 4 | tenant/política | Exigir tenant operacional e revisão de política efetiva. Tenant pendente ou suspenso não opera. [03](03-entidades-tenant.md), [05](05-entidades-catalogo-papeis-e-politica.md) |
| 5 | grants ativos | Encontrar permissão exata em revisão publicada ou concessão direta excepcional ainda válida. [06](06-entidades-pedidos-concessoes-e-escopos.md) |
| 6 | escopo e restrições | Exigir escopo que alcance o recurso e coincida com ativo, objeto, família, turno ou ação HMI quando definidos. [06](06-entidades-pedidos-concessoes-e-escopos.md), [07](07-entidades-topologia.md) |
| 7 | condições operacionais | Exigir competência, ocorrência de turno e designação de ativo se política/ativo/grant as requer. [08](08-entidades-condicoes-operacionais.md) |
| 8 | estado do recurso | A feature proprietária verifica ordem, versão, qualidade, EHS e contrato HMI aplicáveis. Permissão não altera estado. [P06](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md) |
| 9 | fatos e política SoD | Comparar ator efetivo contra autoria/solicitação/execução do mesmo objeto ou versão; bloquear autoaprovação e conflito. [05](05-entidades-catalogo-papeis-e-politica.md) |
| 10 | autoridade derivada | Delegação deve ser subconjunto de grant fonte; exceção deve estar ativa, mínima e não vencer bloqueio físico, qualidade ou SoD não-excepcionável. [09](09-entidades-delegacao-e-excecao.md) |
| 11 | obrigação e auditoria | Retornar `PERMIT`, `DENY` ou obrigação; com permissão, gravar efeito/auditoria/outbox juntos. [10](10-entidades-auditoria.md) |

Permissões podem somar somente nas etapas 5 e 6. Qualquer falha das etapas 1–4 ou 7–10 prevalece;
uma concessão de Owner satisfaz apenas operações de governança que seu papel contém. Esta é a
implementação da prioridade de segurança, qualidade e competência de [P02](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md) e [P06](../../product/01-governanca-de-acesso-e-autorizacao-operacional/06-regras-de-estado-e-segregacao.md).

## Implementação do avaliador

`access-governance/features/evaluate-access/application` implementa a porta contextual e recebe
leitores de sujeito/membership, política/revisão, grant efetivo, descendência, condições, autoridade
derivada e fatos SoD. A feature dona do recurso implementa o leitor de `ResourceContext` e
`AuthorizationHistoryFact`; assim o avaliador aplica regra configurável sem conhecer ordem, HMI ou
qualidade. `ContextualAuthorizedUsecase` resolve esses dados e chama `authorize` antes de `handle`.

## Padrão obrigatório para uma feature protegida

1. O `inbound` recebe intenção e identidade autenticada; valida formato, mas não autoriza.
2. A application resolve o membro e usa uma porta do módulo proprietário para carregar o recurso
   com `tenantId`; se não houver recurso nesse recorte, não revela existência fora dele.
3. A feature constrói `ResourceContext`, chama o avaliador e só então executa seu domínio/efeito.
4. Em listagem, busca ou exportação, a feature transforma tenant/escopos autorizados em predicado
   de consulta no repositório; ela não carrega resultados de outros escopos para filtrá-los depois.
5. Para ação sensível, a feature fornece fatos de versão/autoria/estado ao avaliador e cumpre as
   obrigações de motivo, assinatura, dupla aprovação ou confirmação humana antes de novo `authorize`.
6. Dentro de uma transação local, persiste efeito, `AuditEvent` e mensagem de outbox. Revogação ou
   mudança concorrente exige revalidação imediatamente antes da escrita.

O uso de `AuthorizedUsecase` estático é aceitável apenas para endpoint técnico sem recurso e sem
escopo. As features deste requisito usam `ContextualAuthorizedUsecase` (ou equivalente) na
application: ele recebe identidade, operação e contexto, chama a porta contextual e impede que
`handle` rode antes da decisão. Regras puras do recurso continuam no `domain`; ORM/Keycloak não
entram no domínio.

## Decisões, obrigações e respostas externas

- `PERMIT`: a feature ainda valida concorrência e grava o fato; não pode guardar a permissão em sessão.
- `CONFIRMATION_REQUIRED`: nada é alterado. A confirmação guarda significado, conteúdo/versão,
  identidade e instante, então a feature reavalia tudo antes de concluir.
- `DENY`: nega sem efeito. Recusas relevantes entram em auditoria, mas a resposta não enumera
  recurso, escopo, concessão ou condição de outro tenant.
- Estado/precondição somente é explicado a quem já passou pela fronteira de recurso e escopo; token
  ausente/inválido é `401`, enquanto a feature aplica resposta não enumerável a recurso estrangeiro.

Assim a revogação imediata, a cobertura temporária, a segregação de configuração/qualidade e o
agente que apenas propõe — cenários de [P08](../../product/01-governanca-de-acesso-e-autorizacao-operacional/08-cenarios-e-criterios-de-aceitacao.md) e [P10](../../product/01-governanca-de-acesso-e-autorizacao-operacional/10-cenarios-do-ciclo-de-vida-e-criterios.md) — usam exatamente a mesma decisão.
