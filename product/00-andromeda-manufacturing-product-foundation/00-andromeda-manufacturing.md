# Andromeda Manufacturing — plataforma unificada de MES + MOM + SCADA

## Decisão que este requisito orienta

Andromeda Manufacturing **é o produto/plataforma unificada**. MES, MOM e SCADA/HMI não são três
produtos separados nem um escopo acessório: são capacidades complementares e integradas que,
unidas, compõem a plataforma. MES executa e registra a produção; MOM gerencia de forma mais
ampla as operações de produção, qualidade, estoque e manutenção; SCADA/HMI supervisiona ativos
e oferece contexto e interação operacional. Todas usam o mesmo modelo operacional, evidências e
dados, permissões e governança.

A plataforma multiempresa conecta planejamento empresarial, execução no chão de fábrica e
supervisão de ativos. Ela não substitui de início o ERP nem o controle determinístico do PLC;
torna confiável o fluxo entre ambos e as decisões das pessoas que trabalham nele. [S01] [S03]

## Resultado de negócio esperado

Uma organização deve conseguir saber, para cada unidade produzida ou lote: **o que** foi feito,
**onde**, **por quem**, **em qual equipamento**, **com quais materiais e versões**, **sob quais
condições**, **qual resultado de qualidade** e **quais exceções ocorreram**. A informação deve
ser utilizável em tempo oportuno pelo operador e confiável para gestão, auditoria e integração.

## Como ler este conjunto

| Artefatos | Respondem a |
|---|---|
| 01–02 | princípios imutáveis, escopo, fronteiras e pessoas |
| 03–04 | mapa de capacidades e linguagem/dados mestres comuns |
| 05–06 | jornadas ponta a ponta e tratamento de exceções |
| 07–12 | requisitos por domínio, prioridades e evolução |
| 13–16 | prioridades, critérios verificáveis, fontes e vocabulário |

Este é o requisito-mãe. Domínios posteriores podem aprofundar regras locais, setores e
regulação, desde que não enfraqueçam as decisões aqui registradas.

## Problemas que a plataforma resolve

- Ordens chegam do ERP sem contexto executável, visibilidade de estado ou retorno confiável.
- Dados de máquina, operador, qualidade, material e manutenção ficam desconectados.
- A fábrica descobre perdas tarde, não consegue justificar paradas de forma padronizada ou
  rastrear genealogia para investigação, recall e atendimento ao cliente.
- Plantas e linhas semelhantes usam definições divergentes de produto, KPI e tela operacional.
- Controle de acesso genérico permite que pessoas executem, alterem ou enxerguem o que não lhes
  cabe; configurações críticas não têm histórico suficiente.

## Norte de produto

Começar com um núcleo operacional configurável, auditável e adotável pelo chão de fábrica.
Não prometer uma suíte corporativa inteira de uma vez. A profundidade deve vir por módulo,
setor e risco, preservando o mesmo modelo operacional e as mesmas garantias de isolamento.

**Fontes orientadoras:** [S01], [S03], [S04], [S05]. A catalogação e o método estão em
[15-fontes-e-metodo.md](15-fontes-e-metodo.md).
