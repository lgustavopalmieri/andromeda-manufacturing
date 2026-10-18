# Modelo operacional e dados mestres

## Hierarquia física e organizacional

Adotar, como modelo lógico configurável, a hierarquia: **tenant/organização → empresa legal
(quando necessária) → site/planta → área → linha/processo → célula/centro de trabalho → unidade
de trabalho/equipamento → componente ou ponto de medição**. Ela deve poder representar fábrica
discreta, processo contínuo, batelada e operações de armazenagem, sem forçar todos os níveis.
É a âncora para permissões, capacidade, planejamento, telemetria, custo analítico e KPI [S01].

## Dados mestres compartilhados

| Família | Conteúdo mínimo e relação |
|---|---|
| Recurso | pessoa, habilidade/certificação, equipe, ativo, ferramenta, capacidade, estado e calendário |
| Material | item, unidade, especificação, lote/série, status de qualidade, validade, localização e saldo |
| Produto | produto/acabado/intermediário, revisão, especificação, BOM/fórmula e regra de substituição |
| Processo | roteiro/operação, recurso elegível, tempo padrão, instrução, parâmetro, receita e critério de aceite |
| Ordem | origem, produto/versão, quantidade, prazo/prioridade, estado, roteiro congelado e vínculo de lote |
| Qualidade | plano, característica, método, amostragem, limite, instrumento, decisão e não conformidade |
| Ativo | identificação, fabricante/modelo, capacidade, criticidade, localização, contador, condição e manutenção |
| Contexto | turno, calendário, idioma, unidade, fuso, motivo padronizado e política local |

## Regra de propriedade e sincronização

Para cada atributo mestre, deve haver um sistema proprietário, responsável pelo dado, chave
interna estável, identificadores externos/aliases, versão e regra de resolução de conflito.
Andromeda não deve criar dois "donos" para o mesmo fato. A troca de objeto e transação entre
nível empresarial e operações deve ser contratada e rastreável, coerente com ISA-95 [S01].

## Estados e transições controladas

Objetos críticos usam ciclos explícitos. Exemplos: definição em rascunho → revisão → aprovada →
vigente → substituída/obsoleta; ordem planejada → liberada → preparada → em execução → pausada →
concluída/cancelada; material disponível → reservado → consumido/quarentena/bloqueado; lote de
qualidade pendente → aprovado/reprovado/condicional. Toda mudança registra autor, instante,
motivo, evidência e, quando requerido, aprovador diferente.

## Tempo, calendário e turno

**Template de turno** é a regra planejada e versionada (site, dias de recorrência, horário local,
intervalos, equipe/papel esperado e duração nominal). **Ocorrência de turno** é a instância
concreta gerada para uma data/local: identificador único, início e fim planejados como instantes,
fuso IANA, versão do template/política, duração planejada e estado (prevista, aberta, encerrada,
cancelada). Uma ocorrência pode sofrer substituição de equipe ou ajuste autorizado sem alterar o
template que a originou.

Cada site deve ter calendário operacional, fuso IANA, convenção de dia operacional e política de
atribuição para turno que cruza meia-noite: por data de início, data de encerramento ou outra
regra explícita aprovada pelo tenant. A política produz uma `data operacional` para a ocorrência;
ela não é inferida da data civil exibida. Um turno de 22:00–06:00, por exemplo, pertence à data
definida pela política e não é dividido silenciosamente em dois dias.

Todo evento bruto preserva imutavelmente: identificador/origem, `instante do evento` com offset,
instante informado pela fonte quando distinto, instante de recebimento, qualidade, e a atribuição
à ocorrência de turno/data operacional com a versão da política usada. O modelo separa instante
real de evento e instante de registro, como a distinção `eventTime`/`recordTime` da GS1 EPCIS
[S15]. Datas/times intercambiáveis usam representação inequívoca baseada em ISO 8601 [S13].

Ocorrências são materializadas no fuso do site, não por abreviação ambígua. Mudança de horário de
verão pode produzir duração real menor ou maior que a nominal: duração real é sempre a diferença
entre instantes; duração planejada é a expectativa do template. A regra deve usar a base IANA,
que mantém transições históricas e futuras de fuso/horário de verão [S14].

## Unidades e identificação

Valores sempre preservam unidade original e conversão utilizada. Códigos legíveis não substituem
identificadores estáveis. Lote, série e unidade logística podem ser vinculados por transformação,
agregação e desagregação [S09] [S15].

**Referências:** [S01], [S02], [S09], [S10], [S13], [S14], [S15].
