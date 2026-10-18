# Requisitos — segurança, auditoria e controle de mudança

## Acesso e isolamento

- Toda consulta, ação, arquivo, telemetria, notificação e integração deve estar associada a um
  tenant e passar por autorização antes de revelar conteúdo ou produzir efeito.
- Permissões devem ser granulares por ação e escopo; concessão temporária, delegação, expiração,
  revogação e revisão periódica fazem parte do produto. Papéis são atalhos administráveis, não
  substitutos da decisão contextual.
- Identidades humanas, de serviço e de agente são distintas. Credenciais de dispositivo e
  integração têm proprietário, escopo mínimo, expiração/rotação, estado e registro de uso.

## Auditoria e integridade

- Eventos críticos incluem, no mínimo: identidade, tenant, objeto/escopo, ação, antes/depois ou
  resultado, instante, origem, motivo, aprovação e correlação. Logs de auditoria são consultáveis
  por quem tem permissão e protegidos contra alteração silenciosa.
- Deve haver trilha para mudanças de definição, permissão, política, dado mestre, decisão de
  qualidade, motivo de parada, integração e ação de HMI. A execução referencia versões imutáveis.
- Toda assinatura/atestação eletrônica requerida por tenant/setor identifica signatário, significado
  do ato, conteúdo assinado, instante e vínculo com o registro; requisitos regulatórios específicos
  são configurados e validados em escopos posteriores.

## Mudança controlada

- Configurações são rascunho, revisão, aprovação, publicação/vigência, substituição e reversão
  controlada. Mudanças de alto risco exigem avaliação de impacto, aprovação e plano de retorno.
- Formulários, regras e HMI têm simulação/validação antes de publicação e não são alterados no meio
  de uma execução sem política explícita. Uma ordem iniciada preserva a versão inicialmente aplicada.
- Variantes white-label e locais herdam apenas o que for permitido pelo padrão do tenant; devem
  indicar diferença e responsável, não virar uma cópia sem governança.

## Segurança OT

O produto deve ser projetado e operado considerando disponibilidade, confiabilidade e segurança
física próprias de OT, com responsabilidade compartilhada entre dono de ativo, fornecedor e
integrador. ISA/IEC 62443 e NIST SP 800-82 são referências de risco e ciclo de vida [S07] [S08].
Este requisito não declara conformidade/certificação por si só.

**Referências:** [S07], [S08], [S01], [S06].
