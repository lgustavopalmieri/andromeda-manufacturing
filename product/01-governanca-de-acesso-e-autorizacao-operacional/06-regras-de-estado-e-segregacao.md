# Regras de estado e segregação

## Acesso depende do ciclo de vida

Uma operação só é permitida no estado para o qual foi desenhada. Engenheiro edita rascunho, revisor analisa versão submetida, aprovador aprova, publicador torna vigente; operador inicia ordem liberada/preparada; qualidade decide lote pendente; manutenção atesta retorno após serviço concluído. Alterar URL, repetir requisição ou usar integração não altera estado.

Fato já registrado é evidência: correção cria ajuste ligado ao original, com motivo e aprovador quando aplicável. Permissão de correção não autoriza sobrescrever autoria, instante, valor bruto, versão de processo ou resultado inicialmente observado.

## Segregação mínima configurável por tenant

| Contexto | Atos que não podem ser acumulados pela mesma identidade no mesmo objeto/versão | Controle mínimo |
|---|---|---|
| Receita, roteiro, formulário, regra ou HMI | criar/editar ou solicitar aprovação × aprovar/publicar própria versão | aprovador distinto; política pode exigir dois níveis |
| Mudança crítica de configuração | avaliar impacto/propor × aprovar vigência/reversão | aprovador com escopo e competência adequados |
| Inspeção e qualidade | registrar resultado/solicitar disposição × liberar/conceder a si próprio | decisão segregada quando política/classificação exigir |
| Não conformidade | abrir/registrar desvio × aprovar encerramento/eficácia próprios | responsável de decisão distinto para criticidade definida |
| Produção e ajuste | registrar produção/perda/parada × aprovar correção crítica própria | ajuste preserva fato e aprovação independente |
| Inventário | contar ou lançar ajuste × aprovar próprio ajuste de estoque | limite de valor/risco definido pelo tenant |
| Manutenção crítica | executar serviço × atestar retorno à produção | segundo responsável pela criticidade do ativo |
| Acesso | solicitar/receber privilégio × aprovar revisão excepcional dele | administrador/revisor distinto conforme política |
| Propriedade | solicitar/aceitar tornar-se Owner × concluir própria transferência | Owner anterior ou autoridade de recuperação distinta |
| Agente | definir delegação × confirmar ato crítico executado pelo agente | patrocinador e aprovador humano distintos quando exigido |

Regra compara pessoa/identidade efetiva, não rótulo de papel. Ter dois papéis, usar outra tela ou operar em turno diferente não satisfaz separação. Exceção permitida registra justificativa, risco, autorizador, prazo e revisão posterior; nunca apaga conflito.

## Atos especialmente sensíveis

Transferir/suspender Owner; elevar acesso fora de papel; alterar política de acesso; publicar/reverter regra, HMI ou formulário; conceder qualidade; liberar material bloqueado; ajustar estoque; corrigir fato que altera KPI; retornar ativo crítico; gerir credencial de integração/dispositivo; e qualquer comando físico contratado exigem permissão específica, motivo e auditoria reforçada.

Para ato sensível, decisão revalida estado e escopo imediatamente antes do efeito. Confirmação anterior não vale se ordem, ativo, certificação, bloqueio de qualidade/EHS ou atribuição mudou. Assinatura/atestação requerida identifica significado, conteúdo, versão, identidade e instante; simples login não a substitui.

## Prioridade operacional

Meta de produção, prioridade de ordem e título de Owner nunca suspendem bloqueio de segurança, qualidade ou competência. Pessoa autorizada a reportar risco pode abrir/escalar registro; isso não implica comando de segurança nem permissão para ignorar procedimento local.

**Situação real:** Marcos criou versão 8 do checklist de limpeza e a submeteu. Mesmo tendo papel de Engenheiro e Gestor de Planta, não a aprova nem publica. Renata, revisora autorizada para a linha, aprova; só então publicador designado pode aplicá-la a novas execuções.
