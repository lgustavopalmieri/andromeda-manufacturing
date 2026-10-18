# Personas, papéis e responsabilidades

Esta plataforma concede acesso pela **necessidade operacional comprovável**, não pelo título do
crachá. Uma pessoa pode exercer várias personas, em tenants distintos ou no mesmo turno, desde
que cada atuação tenha papel, permissão, escopo e vigência explícitos.

## Linguagem obrigatória

- **Persona** descreve a responsabilidade de negócio; não concede acesso sozinha.
- **Papel** é um pacote administrável de permissões, pronto para ser atribuído a uma persona.
- **Permissão** autoriza uma operação de negócio determinada, como liberar lote ou editar rascunho.
- **Escopo** limita onde a operação vale: tenant, site, área, linha, célula, ativo ou objeto.
- **Atribuição** une pessoa/identidade, papel, escopo, vigência e condições de atuação.
- **Ativo** inclui máquina, dispositivo, estação, ferramenta ou recurso físico identificado.
- **Owner** é o responsável raiz da conta, não uma exceção às regras de segurança operacional.

## Catálogo de personas

| Persona | Missão e atuação típica | Poderes usuais | Limite inegociável |
|---|---|---|---|
| Owner da conta | Responsável pelo tenant e sua continuidade | ativar tenant, definir governança e nomear administradores | não recebe ato operacional ou aprovação técnica por ser Owner |
| Administrador(a) do tenant | Administrar membros, marca e política permitida | convidar, atribuir e revisar acesso; gerir branding | não lê nem altera produção por padrão |
| Gestor(a) de planta | Responder pela operação do site | acompanhar, despachar e aprovar atos operacionais delegados | não altera padrão corporativo fora de seu escopo |
| Líder de turno | Manter o fluxo e a passagem de turno | priorizar fila, alocar trabalho e escalar exceções | só no turno, local e ações autorizados |
| Planejador(a) | Converter demanda em plano executável | programar, liberar e replanejar ordens | não executa ou reescreve fatos de produção |
| Engenheiro(a) de processo/produto | Definir como produzir | elaborar receita, roteiro, formulário, regra e instrução | não aprova/publica sua própria definição crítica |
| Técnico(a) de setup | Preparar ativo e processo para a ordem | executar checklist, setup e evidência autorizados | não libera exceção crítica própria |
| Operador(a) | Produzir com segurança e qualidade | usar HMI, apontar produção/perda/parada e pedir suporte | apenas ordem, ação e ativo aos quais foi designado |
| Qualidade | Medir e decidir conformidade | inspecionar, conter, decidir lote e tratar NC | não mascara resultado original; segregação pode separar medida e decisão |
| Almoxarife/logística | Garantir material correto e rastreável | receber, reservar, movimentar e conferir | não libera material bloqueado sem concessão válida |
| Manutenção/confiabilidade | Restaurar e preservar capacidade do ativo | registrar falha, executar manutenção e evidenciar retorno | retorno de ativo crítico pode exigir aprovador distinto |
| EHS/segurança | Prevenir dano e controlar risco | registrar/escalar risco, permissão de trabalho e incidente | não substitui resposta de emergência ou salvaguarda física |
| Integrador(a) de sistemas | Operar contrato de intercâmbio de dados | monitorar, reprocessar e manter integração designada | sem leitura ampla de conteúdo produtivo por padrão |
| Auditor(a) | Verificar evidência e conformidade | consultar trilha imutável e exportar quando permitido | não modifica registro nem cruza tenants |
| Agente de IA | Assistir ou cumprir tarefa delegada | consultar, propor ou executar ação listada na delegação | nunca recebe autoridade implícita da pessoa patrocinadora |

Papéis podem se combinar em uma pessoa, mas o conflito entre atos continua a ser avaliado por
identidade efetiva e objeto. Os papéis-base e suas operações estão em
[04-catalogo-de-permissoes-e-papeis.md](04-catalogo-de-permissoes-e-papeis.md).
