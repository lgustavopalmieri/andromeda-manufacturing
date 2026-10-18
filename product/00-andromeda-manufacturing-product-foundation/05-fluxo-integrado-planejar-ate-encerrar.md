# Fluxo integrado: planejar até encerrar

Este fluxo descreve o mínimo rastreável de uma ordem; plantas podem adicionar aprovações e
etapas. Ele separa planejamento empresarial (nível 4), operações de manufatura (nível 3) e
controle físico (níveis 0–2), sem presumir uma tecnologia específica [S01].

1. **Definir e liberar:** engenharia libera a versão de produto, BOM/fórmula, roteiro, receita,
   instruções, limites de qualidade e recursos elegíveis. A alteração posterior não reescreve
   a execução já iniciada.
2. **Receber demanda:** ERP ou planejador cria/atualiza ordem com produto, quantidade, prazo,
   prioridade e origem. A plataforma valida dados mestres, idempotência e estado aceito.
3. **Planejar e despachar:** capacidade, calendário, ocorrência concreta de turno, restrições de
   material, ferramenta, manutenção e competência produzem uma fila justificada. O supervisor
   pode priorizar dentro da política e fica responsável pelo motivo do desvio.
4. **Preparar:** técnico/operador confirma recurso, limpeza/troca, material reservado, versão
   aplicável, treinamento e pré-requisitos de segurança/qualidade; discrepância bloqueia ou
   exige autorização formal.
5. **Executar:** o HMI mostra tarefa, estado de equipamento, parâmetros, instrução e ações
   permitidas. Eventos automáticos e apontamentos humanos registram início, quantidade boa,
   perda, consumo, paradas e condições, associados à ocorrência de turno e à data operacional
   vigentes; a troca de meia-noite não encerra nem reatribui automaticamente a execução.
6. **Controlar qualidade:** inspeções são solicitadas por plano/resultado/evento; material ou
   produção fica em estado apropriado até decisão. Não conformidade mantém vínculo com ordem,
   operação, lote, ativo, pessoa e versão.
7. **Encerrar e reconciliar:** validar quantidades, rendimentos, consumo, retrabalho, sobras,
   status do lote e pendências. Confirmar realização ao ERP e emitir exceções se houver falha.
8. **Aprender:** consolidar genealogia e indicadores; investigar desvio e criar ação corretiva
   sem modificar a evidência de origem.

## Critérios de integridade do fluxo

- Uma ordem não entra em execução sem versão de processo efetiva, escopo físico e responsável.
- O produto bom, perda, retrabalho e material consumido fecham uma reconciliação explicável.
- Eventos tardios ou duplicados são preservados/identificados sem dobrar quantidade ou KPI; a
  ocorrência inicial, versão de calendário e informação de chegada permitem explicar o ajuste.
- Uma pausa por máquina, material, qualidade, segurança ou pessoa tem motivo, duração e fluxo
  de retomada definidos; o motivo não pode apagar o estado bruto observado.
- A confirmação retornada ao ERP identifica a ordem de origem e a versão/instante da realização.

**Referências:** [S01], [S02], [S03], [S09], [S13], [S15].
