# Personas, papéis e responsabilidades

Uma pessoa pode acumular papéis, mas o acesso é concedido pela necessidade operacional e pelo
escopo organizacional — nunca apenas pelo cargo. Segregação de funções é necessária para atos
críticos (por exemplo, criar e liberar uma fórmula, ou registrar e aprovar um desvio).

| Persona | Objetivo no trabalho | Capacidades esperadas | Limites relevantes |
|---|---|---|---|
| Operador(a) | Produzir com segurança e qualidade | consultar instrução/HMI, iniciar/pausar, apontar produção/perda, pedir ajuda | só ativos, ordens e ações autorizados; sem alterar definição liberada |
| Líder de turno | Manter fluxo do turno | alocar pessoas, priorizar fila, validar paradas, escalonar desvios | não altera governança corporativa nem dados de outros turnos sem permissão |
| Supervisor/gerente de produção | Cumprir plano e melhorar desempenho | despacho, acompanhamento, aprovação operacional, análise por linha/site | aprovação técnica/regulatória separada quando aplicável |
| Planejador(a) | Converter demanda em execução viável | capacidade, calendário, sequenciamento, liberação de ordens | não executa nem altera eventos históricos |
| Engenheiro(a) de processo/produto | Definir como fabricar | produto, BOM/fórmula, receita, roteiro, parâmetros e instruções | publicação exige fluxo de revisão/aprovação definido |
| Técnico(a) de setup | Preparar recurso para a ordem | checklist, troca, configuração autorizada, evidência | não aprova a própria exceção crítica quando houver segregação |
| Qualidade | Garantir conformidade e decisão de lote | plano/amostra, resultado, bloqueio/liberação, não conformidade/CAPA | decisão tem escopo, motivo e evidência; não mascara dado original |
| Almoxarife/logística | Garantir material certo no lugar certo | recebimento, estoque, reserva, consumo, transferência, expedição | movimentos rastreáveis; sem liberar material bloqueado |
| Manutenção/confiabilidade | Restaurar e preservar ativo | solicitação, ordem de manutenção, condição, falha, retorno | não fecha sem evidência/procedimento quando exigido |
| EHS/segurança | Prevenir dano e atender obrigação | risco, permissão de trabalho, incidente, ação corretiva | autoridade de interromper trabalho conforme política local |
| Administrador do tenant | Governar usuários, marca e políticas | identidades, papéis, escopos, branding, integrações autorizadas | não ganha automaticamente acesso operacional ou aprovação de qualidade |
| Integrador de sistemas | Manter troca de dados contratada | monitorar/reprocessar integrações no seu escopo | sem leitura ampla de conteúdo produtivo por padrão |
| Auditor(a) | Verificar evidência e conformidade | consulta imutável, exportação permitida, trilha | não altera registros nem vê outro tenant |
| Agente de IA futuro | Assistir ou executar tarefa explicitamente delegada | consumir contrato de ação, propor/executar sob política | identidade própria, escopo mínimo, confirmação/evidência e revogação |

## Modelo de autorização

Uma decisão de acesso avalia: identidade autenticada, papel/atributos, tenant, escopo físico,
estado do objeto, ação solicitada, horário/turno quando aplicável e política de segregação.
Todo indeferimento ou ato relevante pode ser auditado. Acesso de emergência é excepcional,
temporário, justificado e revisável.

**Referências:** [S07], [S08], [S11], [S12].
