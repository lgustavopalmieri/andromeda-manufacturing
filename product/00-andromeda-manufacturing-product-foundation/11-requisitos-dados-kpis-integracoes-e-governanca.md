# Requisitos — dados, KPIs, integrações e governança

## Eventos, histórico e qualidade do dado

- Deve tratar eventos operacionais como evidência contextual: fato, origem, instante de ocorrência
  e recebimento, qualidade, correlação, versão de regra e identidade de quem confirmou/corrigiu.
- Deve suportar retenção, consulta, exportação, agregação e descarte conforme política do tenant,
  obrigação legal e classificação da informação; retenção não apaga trilha de auditoria exigida.
- Deve mostrar incompletude, atraso, duplicidade e estimativa. Indicador deve indicar cobertura e
  definição, para que um usuário não confunda ausência de dado com desempenho real.

## Atribuição temporal e períodos de KPI

- Todo evento bruto mantém, sem sobrescrita, instante de ocorrência com offset, instante/relógio
  da fonte quando fornecido, instante de recebimento, origem, qualidade e sequência disponível.
  Ele referencia a ocorrência de turno, data operacional, fuso e versão de política que lhe foram
  atribuídos; evento tardio/fora de ordem recebe a mesma transparência, não um novo fato.
- Para medida pontual, a ocorrência é a que contém o instante do evento. Para duração, contador ou
  intervalo, a contribuição é calculada pela **interseção com as ocorrências de turno reais**,
  não por quebra simplista no dia civil à meia-noite. Produção e perda de um intervalo obedecem à
  regra de alocação publicada no KPI, inclusive quando atravessam troca de turno.
- Um relatório por turno usa a ocorrência identificada e sua data operacional. Um relatório civil
  opcional pode usar calendário local ou corporativo, mas deve declarar rótulo, fuso, fronteira e
  regra de atribuição; não pode ser chamado de resultado "por turno". A convenção para madrugada
  (data de início ou encerramento) é política de tenant/site versionada.
- Duração planejada/nominal, duração efetivamente ocorrida e duração produtiva são campos
  distintos. Em mudança DST, oito horas de relógio local podem corresponder a sete ou nove horas
  reais; disponibilidade e denominadores usam a definição publicada, nunca suposição de 24 h.
- Alterar calendário, template, fuso ou política afeta novas ocorrências. Não reescreve atribuição
  histórica; correção autorizada cria ajuste rastreável e gera nova versão/reprocessamento do KPI
  com data, motivo, cobertura e vínculo aos eventos originais. ISO 8601 e IANA apoiam a expressão
  inequívoca de instantes e regras civis [S13] [S14].

## KPIs confiáveis

- Cada KPI possui nome, propósito, fórmula, população, unidade, período, fonte, filtros,
  regras de inclusão/exclusão, versão, dono, calendário/turno aplicável e limiares de aviso/ação
  configuráveis.
- Deve calcular e explicar medidas como disponibilidade/uptime, desempenho/throughput, qualidade,
  OEE simplificado, aderência ao plano, taxa de refugo e tempo de parada. OEE só é exibido quando
  seus componentes e tempo planejado são definidos para aquele contexto.
- Deve permitir explorar KPI até ordem, turno, ativo, parada, lote e evento de origem. Não deve
  comparar plantas/linhas sem declarar unidade, calendário, definição e versão compatíveis.
- A linguagem de KPI se inspira na ISO 22400 para MOM e não substitui metas corporativas de nível
  financeiro/logístico [S04].

## Integrações e multi-site

- Deve manter catálogo de integração: parceiro/sistema, escopo de dados, proprietário, contrato,
  mapeamentos de identificador, frequência, estado, falha, reprocessamento e auditoria.
- Deve suportar receber e devolver transações de ordem, realização, material, qualidade e ativos
  conforme a responsabilidade definida. Mensagem repetida, fora de ordem ou inválida não pode
  duplicar produção nem corromper estado.
- Deve permitir padrão corporativo reutilizável e variação local governada: modelo global,
  template de site, adaptação permitida, aprovação e comparação de aderência.
- Deve oferecer relatórios por tenant, empresa/site/área/linha/ativo, com consolidação somente
  quando o usuário estiver autorizado e definições forem comparáveis.

**Referências:** [S01], [S04], [S05], [S09], [S13], [S14], [S15].
