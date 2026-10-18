# Atribuições, escopos e ativos

## O que uma atribuição precisa declarar

Toda concessão deve registrar identidade, tenant, papel/permissões, escopo, início, fim ou regra de revisão, concedente, motivo e estado. Quando pertinente, também declara turno/equipe, ativos nominados, família de produto, competência/certificação necessária, ações HMI permitidas e origem de delegação. Sem esses elementos, acesso não é ativado.

| Estado da atribuição | Significado | Efeito |
|---|---|---|
| Solicitada | necessidade informada, ainda não decidida | não concede acesso |
| Aprovada agendada | aprovada para período futuro | ativa somente no início previsto |
| Ativa | condições atuais satisfeitas | participa da decisão de autorização |
| Suspensa | bloqueio administrativo, segurança ou competência | nega imediatamente operações dependentes |
| Expirada | fim de vigência alcançado | conserva histórico, sem poder de agir |
| Revogada | encerrada antes do fim | conserva motivo, revogador e instante |

## Tipos de escopo

| Âncora | Cobre | Uso típico |
|---|---|---|
| Tenant | recursos que a permissão permitir | Owner, política de acesso e branding |
| Empresa legal/site | recursos sob organização/local escolhido | gestor de fábrica ou auditoria local |
| Área, linha, célula ou centro | filhos físicos daquele nó | líder de turno e engenharia local |
| Ativo/estação nomeado | somente máquina/dispositivo específico | operadora da Prensa P-12 ou técnico de setup |
| Objeto funcional nomeado | recurso não físico determinado | Integração SAP, família de produto ou relatório |
| Turno/equipe/período | recorte adicional ao escopo acima | cobertura temporária do turno noturno |

Escopo amplo não dá permissão que papel não possui. Escopo estreito não revela vizinhos: acesso à Prensa P-12 não permite listar todas as prensas da Linha 4. Consulta por ordem, lote, evento, alarme, KPI ou arquivo filtra pelo contexto herdado e pelas restrições funcionais da pessoa.

## Regra especial para atuar sobre um ativo

Para **operar** ou fazer setup/manutenção em ativo, são cumulativos: permissão da operação, escopo que alcance o ativo, designação explícita ao ativo ou grupo elegível quando política exigir, competência/treinamento vigente e pré-condições de ordem, segurança e qualidade. Designação de ativo não concede gestão de usuários, acesso a outros ativos ou aprovação técnica.

A designação identifica motivo operacional: operar, setup, manutenção, inspeção, supervisão ou consulta. Pode cobrir lista nominada ou classe aprovada; mudança de modelo, criticidade, local ou requisito de competência dispara revisão, sem presumir habilidade ainda adequada.

## Administração de atribuições

- Concedente precisa de autoridade para escopo concedido e não concede além da delegação/política.
- Informa motivo, vigência e, para exceção, data de revisão; sistema mostra impacto antes de confirmar.
- Revogação/suspensão afeta atos futuros imediatamente; fatos anteriores preservam sua autoria.
- Permissão direta exige motivo, aprovador definido pela política e expiração; sem renovação silenciosa.
- Mudança de escopo do ativo preserva local do fato histórico e revisa atribuições ativas afetadas.

**Situação real:** Júlia opera E-02. Para cobrir férias, recebe por sete dias papel Operadora no ativo E-03, apenas turno B, com certificação verificada. Continua sem E-04 e perde E-03 ao fim da cobertura, mesmo que esteja logada.
