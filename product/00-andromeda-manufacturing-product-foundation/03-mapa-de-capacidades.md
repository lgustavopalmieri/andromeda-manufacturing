# Mapa de capacidades da plataforma

O mapa usa as quatro operações MOM de produção, qualidade, inventário e manutenção e suas
atividades recorrentes (definição, recursos, programação detalhada, despacho, execução,
coleta, rastreio e análise) como espinha dorsal [S03] [S04]. Os módulos se integram; não são
licenças ou serviços isolados de informação.

| Domínio | Capacidades de negócio | Resultado observável |
|---|---|---|
| Organização e governança | tenant, marca, localidades, calendários, unidades, políticas, usuários e permissões | operação global coerente e isolada |
| Modelo industrial | hierarquia física, ativos, capacidades, estados, materiais, produtos, especificações | linguagem única do chão de fábrica |
| Engenharia do produto/processo | BOM/fórmula, receita, roteiro, parâmetros, instrução e mudanças | execução reproduzível por versão |
| Integração empresarial | pedidos/ordens, demanda, estoque, cadastros, confirmação e exceções | ERP e operação reconciliados |
| Planejamento e despacho | capacidade, calendário, fila, sequenciamento, alocação e prioridades | ordem certa no recurso e turno certos |
| Execução de produção (MES) | preparação, setup, início/fim, contagem, consumo, perdas, reprocesso, encerramento | registro eletrônico completo da produção |
| SCADA, conectividade e HMI | aquisição, estado, alarmes, tendências, comando autorizado, telas e ações | contexto em tempo real com interação segura |
| Materiais e inventário | recebimento, inspeção, saldo, reserva, movimentação, consumo, lote/série | material correto, rastreável e disponível |
| Qualidade | plano de controle, amostragem, inspeção, SPC futuro, NC, contenção, liberação | decisão de qualidade vinculada à genealogia |
| Manutenção e confiabilidade | condição, falha, solicitação, preventiva/corretiva, peças, histórico | disponibilidade e risco de ativo controlados |
| Trabalho e competência | turnos, equipe, habilitação, instrução, apontamento e fadiga/limite local | pessoa qualificada na tarefa permitida |
| EHS e conformidade | riscos, permissões de trabalho, incidentes, ações, evidências | proteção e melhoria sistêmica |
| Logística e expedição | embalagem, agregação, separação, conferência, despacho e rastreio | produto liberado chega com prova de origem |
| Dados e desempenho | eventos, histórico, genealogia, KPI, relatórios, alertas e investigação | decisão baseada em fato, não em planilha solta |
| Configuração e extensibilidade | formulários, regras, workflows, HMI, versões, templates e localizações | adaptação sem perder controle |
| Segurança e auditoria | identidade, autorização, logs, retenção, privacidade e governança de integração | confiança operacional e accountability |

## Critério de completude de módulo

Um módulo só é considerado utilizável quando define: dados mestres, papéis e permissões, fluxo
normal e exceções, evidência/auditoria, versionamento, escopo tenant/local e indicadores de
adoção. Uma tela sem essas decisões não configura uma capacidade industrial.

**Referências:** [S01], [S03], [S04], [S09], [S10].
