# Governança de acesso e autorização operacional

## Decisão de produto

Este requisito transforma os princípios da fundação em regras implementáveis para criar uma conta
organizacional, estabelecer seu Owner e controlar quem pode ver, decidir ou atuar sobre cada ativo
e processo. Ele complementa, sem alterar, a fundação
[00-andromeda-manufacturing-product-foundation](../00-andromeda-manufacturing-product-foundation/00-andromeda-manufacturing.md).

Uma permissão não é um cargo e um papel não é acesso irrestrito. Todo poder deve ter uma necessidade
operacional, escopo organizacional/físico, vigência, condições de estado e autoria rastreável.

## Resultado esperado

Uma fábrica com vários sites deve poder, por exemplo, permitir que uma operadora execute apenas a
Envasadora E-03 no turno B; que uma engenheira prepare uma nova receita sem publicá-la; que a
qualidade libere um lote sem alterar o resultado original; e que o Owner governe a conta sem ganhar
acesso automático à operação. Tudo isso deve continuar verdadeiro por tela, API, integração, HMI,
consulta, exportação e futura ação de agente.

## Escopo deste requisito

- onboarding do tenant, Owner inicial, continuidade e transferência de propriedade;
- personas, papéis-base, catálogo de operações e acesso baseado em papel/atribuição;
- escopo por tenant, hierarquia física, ativos, objetos funcionais, turno e produto;
- autorização por estado, competência, designação de ativo e pré-condição operacional;
- segregação de funções, delegação temporária, identidades não humanas, exceção e auditoria;
- cenários reais e critérios verificáveis para a implementação inicial.

Não define identidade visual, protocolo de autenticação, telas ou arquitetura técnica. Não converte
Andromeda em controlador de segurança, PLC/DCS/SIS ou autoridade física de emergência.

## Premissas vinculantes herdadas da fundação

1. `tenantId` é a fronteira de isolamento de todo recurso, sinal, arquivo, busca e integração.
2. A hierarquia tenant → site → área → linha → célula → ativo ancora permissões e contexto.
3. Configurações e contratos de HMI são versionados; execução preserva a versão que a governou.
4. Segurança, qualidade, competência e estado do processo prevalecem sobre meta de produção.
5. O contrato de ação HMI serve humano e agente, mas agente só atua por delegação explícita.

## Leitura e prioridade

| Artefato | Decisão detalhada |
|---|---|
| 01 | personas e responsabilidades de negócio |
| 02 | regra de decisão contextual e fronteiras de escopo |
| 03 | criação/ativação do tenant e Owner |
| 04–05 | operações, papéis, atribuições e ativos |
| 06–07 | estado, segregação, identidades, delegação e auditoria |
| 08 | cenários e critérios Given/When/Then |

O recorte Fundação/MVP deve suportar, no mínimo, tenant, Owner, membro, papel, atribuição de
escopo, ativo e trilha de auditoria. Papéis adicionais e políticas sofisticadas podem evoluir sem
enfraquecer as regras deste requisito.
