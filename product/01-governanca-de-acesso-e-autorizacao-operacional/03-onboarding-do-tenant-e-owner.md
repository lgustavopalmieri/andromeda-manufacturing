# Onboarding do tenant e Owner

## Resultado obrigatório da criação de conta

Criar conta corporativa produz novo tenant logicamente isolado e, no mínimo, uma identidade humana
Owner responsável por ele. Não existe tenant operacional ativo sem Owner ativo, nem Owner sem vínculo
explícito com seu tenant. Marca, terminologia, idioma, unidades, fuso e políticas começam vazios ou
com valores neutros; jamais são copiados de outro tenant.

## Dados mínimos para solicitar o tenant

| Informação | Finalidade de negócio | Regra de qualidade |
|---|---|---|
| Nome organizacional e identificador externo, se houver | identificar conta e contrato | nome pode repetir; identificador oficial segue política local |
| País/região principal, idioma, fuso e unidade preferida | apresentação e operação inicial | podem ser complementados por site depois |
| Nome, e-mail corporativo e idioma do Owner inicial | responsabilização e convite | e-mail verificável; não compartilhado |
| Marca inicial e contatos administrativos | white-label e comunicação | alteráveis somente no tenant criado |
| Aceite de política aplicável | governança e evidência | versão, instante e identidade registrados |

O solicitante recebe resultado inequívoco: tenant criado e pendente, ativado, ou recusado com
motivo. Uma repetição correlacionada não cria dois tenants/Owners por acidente; a resolução preserva
a correlação de origem.

## Ciclo de vida de conta e Owner

| Estado | Tenant | Owner inicial | Efeito permitido |
|---|---|---|---|
| Em criação | dados sendo validados | convite ainda não aceito | sem recurso operacional ou outro membro |
| Pendente de ativação | identidade criada/convidada | aguarda verificação e aceite | somente ativação pelo Owner convidado |
| Ativo | conta utilizável | Owner ativo | governança e novas atribuições conforme política |
| Suspenso | acesso ordinário interrompido | pode estar ativo ou suspenso | conserva evidência; não permite operar/integrar |
| Encerrado | conta desativada conforme retenção | vínculo final registrado | sem reativação informal ou reutilização de dados |

Recusa, expiração do convite e suspensão conservam histórico, mas revogam capacidade de agir.
Reativação é ato registrado e sujeito à política contratual e de segurança do tenant.

## Poderes e limites do Owner

Owner possui papel-base de **governança da conta**: manter dados organizacionais e branding,
nomear/remover administradores, definir revisão de acesso, administrar política permitida e iniciar
transferência de propriedade. Pode atribuir papéis disponíveis no catálogo do próprio tenant, com
escopo, vigência e justificativa.

Owner não recebe por padrão permissão de operar HMI, apontar produção, liberar lote, aprovar receita,
executar manutenção, ler telemetria detalhada ou comandar ativo. Para isso precisa de atribuição
operacional própria. Mesmo quando a possui, não aprova ato crítico que criou, editou, solicitou ou
executou quando segregação for obrigatória.

## Continuidade de propriedade

- Deve haver pelo menos um Owner ativo; remover, suspender ou transferir o último é recusado.
- Incluir novo Owner exige aceite explícito do convidado e registro do Owner concedente.
- Transferência exige confirmação do novo Owner; registra anterior, sucessor, instante e motivo.
- Recuperação de Owner ausente é excepcional, com prova de autoridade organizacional e revisão.
- Owner delega administração, mas não cria identidade compartilhada nem transfere responsabilidade
  de governança sem transferência formal.

**Exemplo:** a diretora da Metal Norte cria o tenant e designa Ana como Administradora e Carlos
como Gestor da Planta Campinas. Ana não abre a HMI da prensa; Carlos não administra conta global sem
concessão própria.
