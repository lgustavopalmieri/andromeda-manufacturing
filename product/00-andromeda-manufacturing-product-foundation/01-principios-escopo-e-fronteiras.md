# Princípios, escopo e fronteiras

## Princípios não negociáveis

1. **Isolamento de tenant:** nenhum dado, configuração, sinal, identidade, arquivo, busca ou
   integração de uma organização pode ser exposto a outra.
2. **Permissão contextual:** visualizar, aprovar, operar, liberar, editar e administrar são
   permissões distintas, filtráveis por organização, site, área, linha, ativo e turno.
3. **Versão e vigência:** definições de produto, receita/fórmula, roteiro, procedimento, regra,
   formulário, HMI, KPI e integração têm identificação, responsável, estado, vigência e
   rastreabilidade de uso. Uma execução preserva a versão que a governou.
4. **Segurança de pessoas e processo primeiro:** a plataforma apoia decisão e supervisão; não
   pode burlar salvaguardas locais, intertravamentos, permissivos ou autoridade de parada.
5. **Dado com contexto:** toda observação relevante leva tempo, origem, qualidade, ativo/local,
   ordem/lote quando conhecido e correlação com a ação que a gerou.
6. **Operador no centro:** a interface reduz ambiguidade, mostra estado e exceção relevantes,
   funciona por papel e registra autoria; princípios de HMI seguem [S06].
7. **Contrato operacional humano–agente:** uma definição versionada de HMI/ação especifica
   entradas, pré-condições, efeitos, confirmações, alarmes e evidência. Humanos e futuros
   agentes a consomem, mas agentes nunca recebem autoridade implícita.
8. **Configuração white-label:** idioma, unidade, fuso, marca, terminologia e comportamento
   permitido são por tenant/site; marca ou convenção de um cliente não é padrão global.

## Escopo funcional da plataforma

Abrange MOM (produção, qualidade, inventário e manutenção), MES de execução, integração com
ERP e demais sistemas, conectividade e supervisão SCADA/HMI, e dados operacionais/KPIs. As
capacidades estão no mapa 03 e são independentes do grau de automação da fábrica [S01] [S03].

## Fronteiras de responsabilidade

| Sistema/domínio | Fonte de verdade ou autoridade primária | Papel da Andromeda |
|---|---|---|
| ERP | financeiro, compra, venda, planejamento corporativo | receber/devolver compromissos e realização |
| PLC/DCS/SIS | controle em tempo real, segurança funcional | observar/supervisionar; comando só autorizado |
| WMS/LIMS/CMMS legados | quando adotados como sistema mestre específico | integrar e compor contexto, sem duplicar decisão |
| Andromeda | execução MOM, evidência operacional e definições configuráveis | orquestrar, rastrear, alertar e analisar |

## Premissas e decisões abertas

- Uma organização pode operar múltiplos países, sites, calendários, idiomas, unidades e regras.
- A cadeia de custódia e exigências regulatórias variam por setor; o núcleo suporta evidência,
  mas conformidade setorial certificável é escopo posterior explícito.
- Operação manual, semiautomática e automatizada coexistem na mesma linha.
- Segurança funcional, receita diretamente no controlador e sequenciamento determinístico não
  são substituídos por esta plataforma. Qualquer comando remoto requer avaliação de risco local.
- Planejamento finito/otimização avançada, contabilidade e transporte externo não entram no
  núcleo v1, embora seus eventos e dados possam ser integrados.

**Referências:** [S01], [S06], [S07], [S08].
