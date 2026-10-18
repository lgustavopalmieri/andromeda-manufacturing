# Priorização: fundação, v1 e evolução

Prioridade significa capacidade operacional completa, não uma tela isolada. Um item v1 inclui
permissões, auditoria, estado, exceções, versão quando configurável e critério de aceitação.

| Horizonte | Entregas incluídas | Cortes deliberados / condição para avançar |
|---|---|---|
| Fundação | tenant/branding, identidade/escopo, hierarquia site–ativo, dados mestres mínimos, auditoria, versões, catálogo de motivo/unidade/turno, template e ocorrência de turno, data operacional/fuso, contrato HMI | sem comando físico ou cálculo corporativo; modelo validado em plantas piloto |
| MVP operacional | ativos/dispositivos, onboarding de conectividade, telemetria/estado, formulário/setup, HMI configurável básica, ordem manual/importada, apontamento de produção/perda/parada | uma família de processo e conectores selecionados; exceções rastreáveis |
| **v1** | integração ERP de ordem/realização, planejamento/dispatch básico, materiais/lotes/consumo, receita/BOM/roteiro versionados, inspeção e NC básica, genealogia por granularidade configurada, KPI por ocorrência de turno, dashboard, template de setup, multi-site governado | sem APS de otimização, LIMS/WMS/CMMS completos, SPC avançado ou IA autônoma |
| v1.x | manutenção corretiva/preventiva integrada, expedição/embalagem, competência, relatórios self-service, biblioteca global-local de definições | demonstrar adoção, integridade de dados e redução de apontamento fora do sistema |
| v2 | HMI completo, alarmes/tendências avançados, qualidade ampliada, inventário/logística aprofundados, EHS, workflow de aprovação sofisticado, conectores industriais adicionais | validar operação em múltiplos setores e modos manual/automático |
| v3 | planejamento finito/otimização, manutenção preditiva, SPC/análises avançadas, agente de IA assistivo com contrato de ação e governança | somente após baseline de dados confiável e controles de autoridade validados |

## Critérios para o recorte v1

1. Deve fechar o ciclo "ordem do ERP → executar → qualidade/material → confirmação ao ERP" em
   uma planta piloto, mesmo quando parte da coleta for manual.
2. Deve provar genealogia consultável de lote em cenário de recall simulado.
3. Deve calcular cada KPI básico com definição publicada e drill-down até fontes de evento.
4. Deve operar linhas diferentes no mesmo tenant com escopo de permissão e branding/localização
   apropriados, sem vazamento de dados.
5. Deve rejeitar configuração ou ação operacional sem versão aplicável, permissão e trilha.
6. Deve atribuir turno noturno e evento tardio de modo explicável, inclusive em site com DST.
7. Deve responder a investigação de genealogia com cobertura declarada, sem supor serialização
   onde a política do produto exigir apenas lote.

## Fora do escopo v1, mas preparado por contrato

Contabilidade/custos financeiros, compras e vendas completas, controle de PLC/SIS, digital twin,
otimização matemática de toda a cadeia, certificação regulatória setorial automática e decisão
autônoma de IA. Integrações e referências para esses domínios devem poder ser adicionadas sem
alterar a evidência histórica de v1.

**Referências:** [S01], [S03], [S04], [S07].
