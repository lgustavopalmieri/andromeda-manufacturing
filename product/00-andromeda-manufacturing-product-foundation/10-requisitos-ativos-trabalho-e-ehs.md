# Requisitos — ativos, trabalho, manutenção e EHS

## Ativos e manutenção

- Deve manter hierarquia de ativo, criticidade, localização, capacidade, fabricante/modelo,
  contador, condição, documentação, peças associadas e histórico de eventos/manutenção.
- Deve permitir manutenção preventiva, corretiva, por condição e inspeção: solicitação, triagem,
  planejamento, permissão, execução, evidência, retorno ao serviço e análise de falha.
- Deve correlacionar indisponibilidade, alarme, parada de produção, ordem de manutenção, peça e
  impacto em capacidade. "Concluída" não equivale automaticamente a "apta para produzir".
- Deve apoiar decisão de ciclo de vida que equilibre desempenho, risco e gasto, sem prescrever a
  política de manutenção de cada setor [S10].

## Trabalho, turnos e competência

- Deve configurar template de turno, ocorrência concreta, calendário operacional do site, fuso
  IANA, convenção de data operacional, equipe, papel, estação, idioma e regras locais de jornada.
  Turno planejado e turno efetivamente realizado permanecem distintos, inclusive em hora extra,
  ausência, extensão ou interrupção.
- Deve encerrar/abrir a responsabilidade da ocorrência por passagem de turno: pendências, estado
  de ordem/ativo, alarmes, paradas, qualidade/material bloqueados, riscos EHS e confirmação de
  recebimento. A passagem preserva quem entregou, quem recebeu, instante e exceções não aceitas.
- Deve tratar início/fim em horário de verão pelo fuso do site, com duração real por instantes e
  duração planejada como expectativa; não deve deduzir fuso por sigla. A IANA mantém regras
  civis que mudam por decisões governamentais [S14].
- Deve associar pessoas a habilidades, treinamentos, certificações, validade e autorização de
  tarefa/equipamento. Despacho avisa/bloqueia incompatibilidade conforme a política.
- Deve permitir apontamento de trabalho, transferência de turno e passagem de contexto/pendências
  sem expor informações indevidas ou criar responsabilidade ambígua.

## Saúde, segurança e ambiente (EHS)

- Deve registrar perigos, avaliação de risco, controles, permissões de trabalho, bloqueios
  administrativos, incidentes/quase-incidentes, investigação, ação e verificação de eficácia.
- Deve conectar condição EHS a ordem, local, ativo e tarefa, sem substituir procedimentos de
  emergência, dispositivos de segurança, treinamento legal ou autoridade de parada do site.
- Deve suportar participação do trabalhador, identificação de perigo, conformidade local e
  melhoria contínua, temas centrais da ISO 45001 [S12].

## Regra de prioridade

Uma meta de produção ou KPI jamais oculta uma restrição de segurança, uma liberação de qualidade
pendente ou uma indisponibilidade de ativo. O produto torna o conflito explícito e registra a
decisão/autoridade que o resolveu.

**Referências:** [S10], [S12], [S03], [S07], [S14].
