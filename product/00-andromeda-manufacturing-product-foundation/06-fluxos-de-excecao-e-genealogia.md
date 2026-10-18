# Fluxos de exceção, lote e genealogia

## Parada, desvio e retomada

1. Um sinal, alarme ou operador registra a perda de condição/ritmo.
2. A plataforma correlaciona ativo, ordem/operação, turno e duração; sugere categoria, mas o
   responsável classifica e justifica quando a política exigir.
3. Se qualidade, segurança, manutenção ou material estiverem envolvidos, cria-se a contenção e
   o fluxo especializado; a produção só retoma após a condição de liberação aplicável.
4. A alteração de classificação preserva autor, razão, versões e histórico; o indicador mostra
   dado bruto, dado classificado e pendências.

## Falha de qualidade e rastreabilidade

1. Resultado fora de especificação, inspeção vencida ou amostragem reprovada identifica o lote,
   unidade ou intervalo afetado.
2. O sistema contém material/produção conforme política e cria não conformidade com evidência.
3. Qualidade decide reinspecionar, retrabalhar, usar sob concessão, sucatear ou liberar;
   qualquer decisão tem responsável, justificativa e, quando aplicável, aprovação segregada.
4. A genealogia encontra para trás materiais/componentes e condições de processo, e para frente
   produtos, agregações, estoque, pedido e expedição afetados. A rastreabilidade ponta a ponta
   considera transformação, custódia e distribuição [S09] [S15].

## Material indisponível ou incorreto

O despacho verifica saldo, status de qualidade, validade, localização e substituto aprovado. Ao
ler identificador de lote/série, valida a reserva e o produto/etapa. Substituição, consumo extra,
devolução e sucata registram quantidade, unidade, causa e vínculo de genealogia. Material
bloqueado não pode ser consumido por atalho de interface.

## Perda de conectividade, atraso e correção

A operação deve distinguir: evento recebido, atrasado, duplicado, ausente, estimado e corrigido.
O usuário sabe quando está atuando com informação defasada. Na reconexão, o evento preserva seu
instante de ocorrência, fonte e recebimento; é deduplicado por identificação/evidência e ordenado
por instante de evento, sem ocultar conflito. A atribuição histórica usa a ocorrência e política
vigentes quando o evento ocorreu; não é recalculada só porque o calendário mudou depois.

Correção humana não edita nem apaga o evento bruto: cria um ajuste versionado que referencia o
original, informa autor, instante, motivo, aprovação quando exigida, nova interpretação e efeito
em quantidades/KPI. Relatório deve mostrar dado original, ajuste, momento de reprocessamento e
indicador de completude. Decisão crítica requer confirmação do estado atual, não apenas leitura
histórica. A separação entre momento do fato e de registro tem paralelo em EPCIS [S15].

## Incidente de segurança/EHS

Qualquer pessoa autorizada pode registrar ou escalar condição insegura; a plataforma captura
local, atividade, pessoas potencialmente expostas, contenção inicial e investigação. A gestão
segue política e legislação local, inspirada em identificação de perigos, risco, participação e
melhoria contínua de [S12]; não substitui resposta de emergência nem autoridade local.

**Referências:** [S04], [S09], [S11], [S12].
