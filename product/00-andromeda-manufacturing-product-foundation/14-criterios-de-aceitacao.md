# Critérios de aceitação da fundação

Os exemplos são observáveis e devem guiar refinamentos posteriores. "Autorizado" sempre significa
autenticado, no tenant correto e com a permissão contextual aplicável.

1. **Isolamento:** dado dois tenants e um usuário de A, quando ele consulta, pesquisa, exporta ou
   aciona uma integração, então só recebe/afeta recursos de A, inclusive por identificador direto.
2. **Escopo físico:** dado operador autorizado apenas para Linha 1, quando vê a fila ou o HMI,
   então não visualiza nem executa ordem, sinal ou ação de Linha 2.
3. **Versão executada:** dada uma ordem iniciada com receita/roteiro/HMI V1, quando V2 é publicada,
   então a ordem mantém V1 e a nova execução só usa V2 após sua vigência e liberação.
4. **Mudança auditável:** dada uma alteração de limite de qualidade ou permissão, quando ela é
   salva/publicada, então há autor, instante, antes/depois, motivo, aprovação e escopo consultáveis.
5. **Fluxo ERP:** dada uma ordem aceita, quando é executada e encerrada, então a confirmação de
   realização identifica ordem de origem, quantidade boa/perda, estado e ocorrência única; uma
   retransmissão não dobra a quantidade.
6. **Material correto:** dado lote bloqueado ou fora da validade, quando tentam consumi-lo, então a
   ação é recusada ou segue concessão autorizada com motivo, aprovador e vínculo na genealogia.
7. **Genealogia:** dado um produto/lote expedido, quando qualidade inicia investigação, então ela
   consulta insumos, transformações, recursos, parâmetros/resultados e destinos vinculados.
8. **Parada:** dado estado de ativo parado, quando a duração atinge política de justificativa,
   então o responsável registra categoria/motivo; alteração posterior preserva fato e histórico.
9. **HMI:** dado operador qualificado e ordem preparada, quando abre a estação, então vê apenas
   contexto, instruções, sinais, alarmes e ações permitidas; cada ação devolve sucesso, rejeição,
   timeout ou falha explicitamente.
10. **Conectividade:** dado evento tardio/duplicado de equipamento, quando é processado, então o
    registro indica qualidade/ordenação e o KPI não é contabilizado duas vezes.
11. **Qualidade:** dado resultado fora de limite, quando registrado, então a política contém o
    escopo afetado e impede a liberação até decisão rastreável de pessoa autorizada.
12. **KPI:** dado um OEE exibido, quando gestor abre o detalhe, então vê fórmula/versão, período,
    tempo planejado, disponibilidade, desempenho, qualidade e eventos/ordens que o compõem.
13. **White-label/global:** dado site em outro país, quando acessa o produto, então idioma, fuso,
    unidade e terminologia seguem sua configuração sem alterar o dado original nem outro site.
14. **Agente futuro:** dado agente sem delegação explícita, quando solicita ação operacional, então
    ela é recusada. Dada delegação ativa, a execução registra identidade do agente, política,
    precondições, resultado e eventual confirmação humana.
15. **Segurança:** dado usuário sem permissão de alteração ou integração fora de escopo, quando
    tenta ação por tela ou canal alternativo, então a plataforma nega e registra tentativa conforme
    política, sem revelar conteúdo sensível.

16. **Turno noturno:** dado template 22:00–06:00 no site e política "data de início", quando a
    ocorrência de 10/06 é materializada e um evento ocorre às 02:00 de 11/06, então ambos ficam na
    mesma ocorrência, a data operacional é 10/06 e o relatório por turno não divide o resultado
    na meia-noite; o relatório civil, se usado, fica identificado como calendário civil do site.
17. **Mudança de política:** dada a ocorrência noturna anterior atribuída por data de início, quando
    o tenant troca a política para data de encerramento, então só novas ocorrências usam a nova
    versão; a ocorrência anterior, seus eventos e KPI mantêm atribuição histórica consultável.
18. **DST:** dado turno local 22:00–06:00 que cruza avanço de uma hora no fuso IANA do site, quando
    a ocorrência é criada, então sua duração planejada permanece a do template e sua duração real
    é calculada por instantes (uma hora menor); no recuo de uma hora, é uma hora maior. Relatório
    exibe fuso/offset, ocorrência e duração usada, sem usar sigla ambígua ou assumir oito horas.
19. **Evento tardio/correção:** dado evento de máquina ocorrido às 23:58 e recebido às 00:10, quando
    é aceito, então preserva ambos os instantes, origem, qualidade e atribuição da ocorrência pelo
    instante de evento. Dada correção manual, então ela referencia o bruto, possui autor/motivo e
    gera ajuste/reprocessamento visível sem apagar o original nem duplicar o KPI.
20. **KPI por interseção:** dado intervalo de parada das 21:55 às 22:10 em duas ocorrências, quando
    calcula disponibilidade por turno, então aloca cinco minutos à primeira e dez à segunda pela
    interseção real, mantendo fórmula, calendário, política e versão do KPI visíveis.
21. **Granularidade de rastreio:** dado produto configurado para lote e outro para serial, quando
    são consumidos/produzidos, então o primeiro consulta genealogia por lote sem exigir serial e o
    segundo mantém relação por instância; ambos registram quantidade/UOM, ordem/operação e recurso.
22. **Genealogia de transformação:** dado dois lotes de insumo que são mesclados, parte do produto
    é retrabalhada e unidades são agregadas em palete, quando qualidade consulta qualquer insumo,
    produto ou palete, então percorre para trás/frente transformação, divisão/mescla, retrabalho e
    agregação/desagregação, com local/custódia, versão de processo e cobertura/lacunas declaradas.
23. **Disposição:** dado item/lote reetiquetado, devolvido ou sucateado, quando ocorre a ação, então
    mantém a identidade/relação anterior, destino/disposição, quantidade real e motivo; uma busca
    futura não trata o item como desaparecido nem como disponível para expedição sem liberação.

**Bases:** [S01], [S04], [S06], [S07], [S09], [S13], [S14], [S15], [S16].
