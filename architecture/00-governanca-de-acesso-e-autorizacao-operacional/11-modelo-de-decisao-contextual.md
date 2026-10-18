# Modelo de decisão e integração com features

## Ordem de avaliação

Para uma `AuthorizationRequest`, o serviço aplica a sequência abaixo. Falhas não são compensadas
por outro papel e a resposta externa não revela recursos fora de escopo.

1. Autenticar token e resolver `Identity`; selecionar somente um contexto de tenant.
2. Carregar recurso já filtrado por `tenantId` e formar `ResourceContext` confiável.
3. Exigir tenant ativo e `TenantMember` ativo, dentro da vigência do vínculo.
4. Rejeitar estado suspenso/revogado/expirado de identidade, membro, grant, delegação ou exceção.
5. Encontrar grants ativos cujo papel/revisão ou permissão direta contém a operação exata.
6. Exigir que ao menos um grant alcance o recurso por escopo e todas as restrições do grant coincidam.
7. Avaliar turno, competência e designação de ativo quando política ou ativo os exige.
8. Validar estado e pré-condições próprios do recurso, fornecidos pelo módulo da operação.
9. Consultar fatos no objeto/versão para segregação; bloquear autoaprovação e conflito configurado.
10. Aplicar delegação ou exceção somente se ainda válida; produzir obrigações de assinatura/confirmação.
11. Persistir o efeito, o evento de auditoria e outbox na mesma transação local quando permitido.

Permissões somam apenas nos passos 5 e 6. Qualquer negação dos demais passos prevalece. Uma
concessão de Owner satisfaz apenas operações de governança previstas pelo papel; não ignora 7–10.

## Padrão para cada feature protegida

Authentication fica em middleware HTTP do `platform`. O handler passa identidade autenticada e
entrada para a porta autorizada da feature. Na camada `application`, a feature resolve o contexto
do recurso por uma interface de leitura e chama `ContextualAuthorizationServiceInterface` antes do
efeito. Ela também fornece o validador de estado da operação; por exemplo, ordem liberada ou lote
pendente. Esse padrão substitui o gate estático de papéis para recursos operacionais.

O uso de `AuthorizedUsecase` simples continua adequado a endpoints técnicos sem recurso e sem
escopo, como health. Endpoints de produto devem usar uma base `ContextualAuthorizedUsecase` que
recebe operação exata, contexto e identidade; não pode aceitar `roles` do JWT como decisão final.

## Contexto de recursos futuros

Cada módulo futuro declara uma porta interna semelhante a `Resolve<Resource>AuthorizationContext`.
Ela lê o recurso com predicado de tenant e devolve seus local/ativo, versão, estado, família de
produto e ação HMI quando aplicáveis. Assim, HMI, REST, importação, MQTT ou agente chegam à mesma
decisão. O módulo proprietário também grava esses valores no fato operacional, não os recalcula da
topologia atual para auditoria histórica.

## Erros e obrigações

`401` significa token ausente ou inválido. Falta de poder, recurso estrangeiro ou escopo incompatível
recebe resposta não enumerável conforme a feature; regra de estado/precondição dá erro de negócio
sem expor dado protegido. Uma decisão `confirmation_required` não realiza o efeito: a próxima
feature deve registrar confirmação humana, assinatura ou segundo aprovador e reavaliar tudo.
