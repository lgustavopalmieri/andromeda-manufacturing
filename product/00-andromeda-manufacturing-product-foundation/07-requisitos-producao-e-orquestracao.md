# Requisitos — produção, engenharia e orquestração

## Engenharia de produto e processo

- O sistema deve manter produto e versão/revisão, BOM ou fórmula, roteiro, operações,
  recursos elegíveis, parâmetros, instruções, critérios de qualidade e anexos controlados.
- Para processos em batelada, deve suportar a separação entre receita geral e de site, estrutura
  de receita/procedimento e registro de batelada; o modelo segue conceitos de ISA-88 [S02].
- Uma mudança deve passar por fluxo configurável de revisão/aprovação, vigência e comunicação;
  a publicação identifica impacto em ordens, estoque, treinamento e HMI.
- Setup reutilizável deve poder ser salvo como template versionado, com compatibilidade declarada
  para produto, recurso, local e faixa de validade.

## Planejamento detalhado e despacho

- A plataforma deve receber e expor demanda/ordem, priorizá-la por regras explicáveis e alocar
  recurso, data/turno e sequência, respeitando restrições disponíveis.
- Deve informar capacidade planejada versus efetiva e tornar visíveis conflitos de calendário,
  competência, manutenção, material e qualidade antes do despacho.
- Replanejamento não pode apagar o plano ou realização anterior; motivo, autor e impacto devem
  ser auditáveis. Usuários só alteram filas dentro de seu escopo e autoridade.

## Execução e registro de produção

- Cada operação deve aceitar início, pausa, retomada, encerramento, cancelamento e transferência
  de responsabilidade com regras de estado e confirmação apropriadas.
- Deve registrar quantidade boa, perda, refugo, retrabalho, rendimento, tempo, consumo e
  produção intermediária/acabada por ordem/operação/recurso/turno.
- Deve permitir motivos hierárquicos e configuráveis para perdas e paradas, sem reclassificar
  silenciosamente o fato original. Motivo obrigatório e dupla aprovação são políticas por tenant.
- Deve gerar registro eletrônico da execução com operador/agente, instrução e versões aplicadas,
  evidências, exceções e assinaturas/atestação quando exigidas pela política local.

## Regra de autoridade

Nenhuma regra de negócio transforma Andromeda no controlador de segurança ou em fonte de verdade
de intertravamento. Uma ação "iniciar" no produto pode significar solicitar, registrar ou
confirmar início; seu efeito e confirmação são explícitos no contrato de HMI/integração.

**Referências:** [S01], [S02], [S03], [S06].
