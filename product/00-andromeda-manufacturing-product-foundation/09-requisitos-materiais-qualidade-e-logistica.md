# Requisitos — materiais, qualidade, logística e expedição

## Materiais e estoque operacional

- Deve suportar recebimento/identificação, inspeção de entrada, localização, saldo, status,
  reserva, transferência, consumo, devolução, ajuste com aprovação e inventário cíclico.
- Cada movimento mantém origem, destino, quantidade/unidade, lote/série, responsável, instante,
  ordem/processo quando aplicável e justificativa. Saldo visível não é autorização de uso.
- A alocação de material valida compatibilidade de produto, revisão, status de qualidade,
  validade, condição de armazenagem e regra de substituição. Deve impedir consumo indevido ou
  registrar formalmente uma concessão autorizada.

## Qualidade em processo e liberação

- Deve definir planos de controle por produto/processo/site/versão: características, método,
  frequência/amostra, limite, instrumento, instrução e consequência de resultado.
- Deve registrar resultado, unidade, método, instrumento, operador, instante, evidência e decisão.
  Resultado manual e automático são distinguíveis; correção preserva o valor e motivo originais.
- Deve tratar não conformidade, contenção, disposição, retrabalho, concessão, causa, ação
  corretiva/preventiva e verificação de eficácia, vinculando todos à genealogia.
- Deve permitir decisão de qualidade sobre material, lote, unidade e expedição, com permissões e
  segregação configuráveis. A evidência apoia um sistema de qualidade, sem afirmar certificação
  ISO automática [S11].

## Rastreabilidade, embalagem e expedição

- Deve distinguir três granularidades, sem tratá-las como equivalentes: **unidade/serial** é uma
  instância individual identificável; **lote/batelada** agrupa quantidade produzida/recebida sob
  condições comuns; **unidade logística** (caixa, palete, contêiner) identifica a embalagem ou
  carga que pode conter itens/lotes. GTIN+serial, GTIN+lote e SSCC ilustram os níveis [S09] [S16].
- A política de rastreabilidade é configurável por produto, site, cliente e setor: pode exigir
  unidade serializada, apenas lote ou ambos. O produto não afirma que toda indústria exige
  genealogia por unidade; escolhe-se granularidade proporcional a risco, obrigação e viabilidade.
- Deve gravar relações imutáveis para **consumir, produzir, transformar, dividir, mesclar,
  agregar, desagregar, retrabalhar, reetiquetar, devolver e sucatear**. Relação não é apagada ao
  corrigir: o ajuste aponta para a relação anterior e explicita destino/disposição.
- Cada evento de genealogia deve capturar identificação/granularidade, origem e destino/custódia,
  localização, quantidade solicitada e efetiva com UOM, ordem/operação, recurso, pessoas/agente,
  instante, versões de receita/processo/HMI, resultados de qualidade e parâmetros críticos quando
  aplicáveis. Eventos EPCIS formalizam transformação e agregação/desagregação [S15].
- Deve construir consulta para trás e para frente por unidade, serial, lote, unidade logística,
  ordem, ativo, período, fornecedor e cliente/destino, respeitando escopo de permissão e proteção
  comercial. A resposta informa cobertura: relações confirmadas, dados ausentes/atrasados,
  estimativas, lacunas de captura e período/fonte consultados; nunca chama de completa sem base.
- Deve registrar embalagem, etiqueta, pesagem, separação, conferência, liberação e despacho;
  padrões abertos de identificação/captura/compartilhamento são preferidos [S09] [S16].

**Referências:** [S09], [S11], [S01], [S15], [S16].
