# Identidades, delegação, exceção e auditoria

## Tipos de identidade

| Tipo | Finalidade | Limite obrigatório |
|---|---|---|
| Humana | realizar trabalho e aprovar decisões | individual; não compartilhada; responde por seus atos |
| Serviço/integração | trocar dados sob contrato definido | só operações, dados e fluxo contratados; não herda pessoa |
| Dispositivo | publicar/receber contexto do ativo identificado | limitado ao ativo/fonte designados; não vira usuário operacional |
| Agente de IA | consultar, propor ou cumprir tarefa delegada | identidade própria, mínimo privilégio e revogação imediata |

Integração ou dispositivo não usa papel humano para contornar escopo. Agente não representa silenciosamente pessoa: cada resposta e ato mostra agente, patrocinador, delegação e resultado. Credencial tem proprietário, estado, escopo, vigência, rotação/revisão conforme política e registro de uso.

## Delegação e cobertura temporária

Delegar é permitir que outra identidade execute uma **lista finita de atos delegáveis**; não é compartilhar credenciais nem copiar todos os papéis. A delegação declara delegante, destinatário, tenant, recurso/ativo, ações, início/fim, motivo, condições, aprovador quando necessário e possibilidade de revogação.

- Delegante só delega atribuição ativa e marcada delegável; destino nunca recebe mais escopo/poder.
- Política pode exigir aceite do destino e aprovação de líder/revisor antes da ativação.
- Owner, transferência de propriedade, aprovação de próprio conflito, política de acesso, credencial e atos não delegáveis definidos pelo tenant não são entregues por este mecanismo.
- Expiração, revogação, suspensão, perda de certificação ou mudança de estado relevante bloqueia/encerra delegação.
- A ação registra executante e delegação; responsabilidade não some nem é falsamente atribuída ao delegante.

Para agente de IA, delegação também declara se ele só propõe, executa com confirmação humana ou executa automaticamente ação de baixo risco. Ações HMI obedecem contrato versionado, pré-condições e evidência iguais às humanas. Agente nunca administra identidades, eleva acesso, transfere Owner, libera qualidade ou emite comando físico sem política futura explícita e confirmação humana quando requerida.

## Emergência e exceção

Acesso emergencial restaura governança ou trata incidente digital/operacional quando fluxo normal é inviável; não é atalho para segurança física, intertravamento, qualidade ou meta de produção. É excepcional, mínimo, por prazo curto, com motivo, escopo, responsável, aviso ao Owner/revisor e análise posterior obrigatória. Expira automaticamente e não é renovado silenciosamente. Procedimento local de emergência continua independente do produto.

## Auditoria e revisão de acesso

Devem ser auditáveis: criação/ativação/suspensão de tenant, convite, aceite, alteração de papel, escopo, competência, designação de ativo, delegação, negação relevante, aprovação, uso de exceção, ação HMI, integração e credencial. Evento contém ao menos identidade efetiva, tenant, ação, recurso/escopo, decisão, instante, origem, correlação, motivo e antes/depois ou resultado.

Tenant define frequência de revisão e responsáveis. Revisão lista atribuições ativas, próximas de expirar, sem uso, privilegiadas, delegadas e excepcionais, permitindo confirmar, suspender ou revogar com trilha. Auditor consulta evidência imutável somente no escopo autorizado.

**Situação real:** durante ausência do supervisor, agente sugere classificação de parada da Linha 2 e preenche rascunho. Não confirma justificativa: líder de turno designado confere contexto, confirma ação e trilha registra ambas identidades.
