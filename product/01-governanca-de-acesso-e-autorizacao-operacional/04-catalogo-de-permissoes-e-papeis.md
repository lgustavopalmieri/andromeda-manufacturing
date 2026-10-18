# Catálogo de permissões e papéis

## Convenção de operações

Cada domínio usa operações de negócio explícitas. `Consultar` não inclui exportar; `registrar` não inclui corrigir; `editar rascunho` não inclui aprovar/publicar; `administrar` não inclui operar. O catálogo abaixo é a base para atribuições e pode ganhar operações sem ampliar as existentes.

| Domínio | Operações mínimas distintas | Recursos e contexto |
|---|---|---|
| Organização | consultar/editar perfil, branding, localização, calendário e política | tenant, empresa legal ou site |
| Acesso | consultar membros, convidar, ativar/suspender, atribuir/revogar, revisar, transferir Owner | membro, papel, escopo e tenant |
| Estrutura e ativos | consultar, cadastrar, editar, inativar, designar operador/técnico | hierarquia física, ativo, dispositivo e capacidade |
| Dados e configuração | consultar, criar, editar rascunho, submeter, revisar, aprovar, publicar, retirar | mestre, formulário, regra, HMI, setup e template versionados |
| Planejamento e ordem | consultar, criar/importar, programar, liberar, despachar, replanejar, cancelar | produto, ordem, fila, recurso e turno |
| Execução/HMI | consultar contexto, preparar, iniciar/pausar/retomar/encerrar, apontar, justificar, solicitar suporte | ordem/operação, turno, ativo e contrato HMI |
| Qualidade | registrar resultado, abrir NC, conter, reinspecionar, decidir disposição/liberação, conceder | amostra, lote, unidade, plano e expedição |
| Material e logística | receber, inspecionar, reservar, movimentar, consumir, devolver, ajustar, expedir | item, lote/série, saldo, local e unidade logística |
| Manutenção e EHS | solicitar, planejar, executar, atestar retorno, registrar risco/incidente, emitir/encerrar permissão | ativo, atividade, risco e ordem de trabalho |
| Telemetria e integração | consultar sinal, configurar contrato, ativar/inativar, monitorar, reprocessar, gerir credencial | ativo, fonte, integração, mensagem e tópico lógico |
| Dados e auditoria | consultar KPI/detalhe, exportar, consultar trilha e revisar acesso | relatório, dado classificado, evento e log |

`Excluir` físico não é operação ordinária para fatos, telemetria, qualidade, execução, genealogia ou auditoria. Quando permitido para configuração, significa retirar de uso e preservar versões e referências. Comando físico contratado é permissão separada e nunca consequência de `iniciar` ordem no HMI.

## Pacotes de papel recomendados

| Papel-base | Permissões que normalmente reúne | Escopo inicial recomendado |
|---|---|---|
| Owner da conta | organização e acesso de governança; transferência de Owner | tenant, sem execução operacional |
| Administrador do tenant | membros, atribuições, branding e políticas permitidas | tenant, sem dados produtivos por padrão |
| Gestor de planta | visão operacional, despacho e aprovação delegada | um ou mais sites |
| Líder de turno | fila, designação, passagem e exceções operacionais | área/linha e turno designados |
| Planejador | programar, liberar e replanejar ordem | site, família de produto ou linha |
| Engenharia de processo | elaborar/revisar definições de produto, processo, setup e HMI | site, produto/processo ou padrão autorizado |
| Técnico de setup | executar setup, checklist e evidência | ativos designados e turno aplicável |
| Operador | consultar/executar HMI, apontar fatos e pedir suporte | ativo/estação e ordens designados |
| Inspetor de qualidade | registrar inspeção, NC e contenção | produto/processo/site designado |
| Aprovador de qualidade | decidir lote, disposição e concessão | produto/site, distinto do ato conflitado |
| Logística | receber, reservar, mover, consumir e expedir | armazém/local e material autorizados |
| Manutenção | executar/registrar serviço, condição e falha | ativos/manutenção designados |
| EHS | risco, incidente e permissão de trabalho | local/atividade e política local |
| Integrador | monitorar e reprocessar contrato próprio | integração e fluxo de dados específicos |
| Auditor | ler trilha, evidência e exportação permitida | tenant/site/objeto de auditoria, somente leitura |

Papéis podem ser combinados, mas os conflitos de [06-regras-de-estado-e-segregacao.md](06-regras-de-estado-e-segregacao.md) continuam ativos. Permissões diretas são exceção justificada e temporária; não devem virar catálogo informal.

**Exemplo:** líder de turno pode priorizar a fila da Linha de Envase 3, mas não alterar fórmula vigente. Se também for técnica de setup, recebe segunda atribuição apenas para ativos designados e ainda não aprova a própria liberação crítica.
