# Glossário operacional

| Termo | Significado neste requisito |
|---|---|
| Agente | identidade de software que pode consultar, propor ou executar ação somente por delegação explícita |
| Área / linha / célula | níveis físicos lógicos usados para organizar recursos; podem ser omitidos quando não existirem |
| Ativo | recurso físico mantido para entregar valor: máquina, utilidade, instrumento ou componente relevante |
| Batelada/lote | quantidade produzida ou material identificável sob condições comuns; não são sinônimos obrigatórios |
| BOM / fórmula | relação versionada de componentes/ingredientes e quantidades para fabricar um produto |
| Controle | atuação determinística de campo/PLC/DCS; fora da autoridade implícita de MES/HMI |
| Despacho | decisão de enviar uma tarefa/ordem para recurso, equipe e sequência de execução |
| Genealogia | relações de origem, transformação, agregação e destino entre materiais, produção e logística |
| HMI | interface humano-máquina que contextualiza estado e ações operacionais; é um contrato versionado |
| KPI | medida quantificável com fórmula, escopo, fonte, período e versão explícitos |
| MES | capacidades de executar, registrar e acompanhar produção entre planejamento e controle |
| MOM | gestão das operações de produção, qualidade, inventário e manutenção no nível operacional |
| Não conformidade | desvio de requisito, registrado com contenção, decisão e ação subsequente |
| Ordem de produção | compromisso executável de fabricar quantidade/produto sob processo e recursos definidos |
| OEE | medida composta de disponibilidade, desempenho e qualidade; só comparável com definição igual |
| Ocorrência de turno | instância concreta, identificada e datada de um template; tem início/fim/duração planejados e realizados |
| Data operacional | data atribuída por política versionada ao turno/ocorrência; pode divergir da data civil de um evento noturno |
| OT | tecnologia operacional que monitora ou interage com o processo físico, incluindo sistemas de controle |
| Receita/roteiro | definição versionada de como produzir: procedimento/parâmetros ou sequência de operações e recursos |
| SCADA | supervisão, aquisição de dados e visualização de processo/ativo, distinta do controle de campo |
| Serial/unidade | identificador de uma instância individual; permite genealogia no nível de cada unidade quando a política o exigir |
| Template de turno | definição recorrente e versionada de horários e expectativas locais; não é o registro de um turno realizado |
| Tenant | conta organizacional logicamente isolada que contém seus dados, políticas, marca e configurações |
| Traçabilidade | capacidade de reconstruir história, aplicação ou localização de um objeto ao longo do ciclo de vida |
| Unidade logística | embalagem/carga identificável — por exemplo, caixa ou palete — que pode conter itens/lotes e ter custódia/local próprios |
| Versão / vigência | identificação de uma definição e intervalo/condição em que ela pode governar nova execução |

## Convenções de leitura

"Deve" indica requisito de produto. "Pode" indica variação permitida ou evolução. "Fonte de
verdade" significa sistema responsável por um atributo/fato definido; não implica que os demais
sistemas não o armazenem como referência. Termos de [S01]–[S04] orientam a linguagem, mas a
modelagem detalhada será validada por setor e planta piloto.

**Referências terminológicas:** [S09], [S13], [S14], [S16].
