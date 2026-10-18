# Requisitos — SCADA, conectividade e HMI

## Conectividade e observabilidade operacional

- Deve cadastrar ativo/dispositivo, fabricante/modelo, local, capacidades, sinais, unidades,
  qualidade esperada de dado, estado de conexão e proprietário operacional.
- Deve adquirir telemetria e eventos de fontes industriais, associando origem, carimbo de tempo,
  qualidade, contexto de ativo e correlação com ordem/estado quando disponível.
- Deve suportar protocolos e conectores conforme o ambiente, priorizando interoperabilidade
  semântica. OPC UA cobre desde sensores e atuadores até MES e ERP [S05]; MQTT pode coexistir.
- Deve representar estado da máquina, alarme/evento, tendência e histórico, e distinguir sinal
  cru de estado derivado. Toda regra de derivação é versionada e explicável.
- Deve permitir que conectividade seja ativada/desativada por ativo e revisada quando configuração
  ou credencial mudar; fonte não autorizada ou fora do escopo do tenant é rejeitada.

## HMI configurável e contrato de ação

- A tela é composta de definições versionadas: contexto, widgets, dados, instruções, alarmes,
  ações, validações, pré/pós-condições, confirmação, exceções e acessibilidade/localização.
- Deve apresentar a tarefa no nível de detalhe do papel: operador vê o necessário para decidir;
  supervisor vê contexto adicional; cada um apenas no escopo concedido.
- Ações incluem ao menos apontar/confirmar produção, iniciar/pausar/encerrar representação de
  ordem, justificar parada, declarar perda, registrar inspeção e solicitar suporte — sempre com
  efeito contratado e evidência de resultado.
- Deve adotar princípios de HMI de alto desempenho: hierarquia de atenção, navegação coerente,
  uso intencional de cor, alarme acionável, feedback e gestão de mudanças [S06].
- O mesmo contrato deve disponibilizar formato consumível por agente futuro; execução autônoma é
  proibida até que identidade, permissão, escopo, política de aprovação e registro estejam ativos.

## Alarmes e comandos

Alarme não é apenas uma notificação: possui severidade, condição, ativo, instante, reconhecimento,
proprietário e política de escalonamento. Um comando só aparece se a permissão e o estado o
permitirem, deixa trilha ponta a ponta e devolve confirmação inequívoca, timeout ou falha. A
plataforma não declara que um comando foi executado sem confirmação da autoridade correspondente.

**Referências:** [S05], [S06], [S07], [S08].
