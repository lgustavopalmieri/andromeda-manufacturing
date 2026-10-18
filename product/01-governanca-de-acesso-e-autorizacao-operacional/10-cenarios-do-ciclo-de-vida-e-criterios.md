# Cenários do ciclo de vida e critérios verificáveis

Os critérios abaixo complementam [08](08-cenarios-e-criterios-de-aceitacao.md). “Ativo”
significa atribuição válida, não apenas identidade que aceitou convite. Papéis e ações continuam
sujeitos ao catálogo de [04](04-catalogo-de-permissoes-e-papeis.md) e às condições de
[05](05-atribuicoes-escopos-e-ativos.md).

## Casos cotidianos

| Situação real | Decisão de negócio e exemplo |
|---|---|
| Admissão de operadora | RH informa que Ana inicia em 03/05, na Produção; gerente de produção patrocina Operadora para Envase 3/turno B; treinamento confirma a certificação E-03; admin local concede, convida e agenda o início. Líder só a escala na E-03 depois disso. |
| Nova gerente de área | A gerente do site patrocina o papel Gestora de Área para a nova líder da área de Corte. Administrador do site o concede no recorte Corte; ela pode patrocinar a equipe e cumprir aprovações que sua atribuição permitir, mas não ganha acesso a Envase ou HMI por default. |
| Transferência de linha/site/cargo | Gestor atual ou destino registra mudança e o novo gestor patrocina o perfil de destino. O provisionador encerra/revisa o escopo antigo e concede o novo somente após competência aplicável. Não há “migração” automática de todos os poderes. |
| Férias | Líder pede cobertura de Beatriz na Linha 2, turno noturno, por dez dias. Admin concede atribuição temporária e, durante a vigência, o líder a designa aos ativos elegíveis. No término, a designação e a atribuição deixam de produzir efeitos. |
| Desligamento ou afastamento | RH/HRIS informa a data/hora efetiva; atribuições são suspensas ou revogadas conforme política, inclusive delegações e sessões futuras. Fatos anteriores preservam autor e evidência. |
| Terceirizada de manutenção | Responsável de contrato registra empresa, prazo e patrocinador; manutenção patrocina os ativos; competência/EHS confirma requisitos; admin local concede somente manutenção nos ativos contratados. Fim do contrato encerra o acesso. |

## Critérios Given/When/Then

1. **Identidade não é acesso.** Dado que RH registrou Paulo como empregado futuro, quando o
   convite é aceito antes da admissão, então Paulo pode concluir identidade, mas não vê dados nem
   atua até início, atribuição concedida e condições de competência atendidas.
2. **Operadora recém-contratada.** Dado pedido patrocinado para Ana operar E-03 no turno B e
   certificação vigente, quando o administrador de acesso da Linha Envase concede o papel/escopo
   aprovado, então Ana atua apenas em E-03/B; o líder pode escalá-la, mas não lhe dá E-04.
3. **Liderança sem elevação.** Dada Lívia como líder da Linha 1 sem atribuição de acesso, quando
   tenta convidar, conceder Operador ou criar atribuição, então é negado. Quando ela designa um
   operador já autorizado à Linha 1 para seu turno, então a designação é registrada e válida.
4. **Líder provisionador delegado.** Dada Lívia com delegação vigente para provisionar Operador
   apenas na Linha 1, quando existe pedido patrocinado, vínculo válido e competência confirmada,
   então ela pode conceder o pacote aprovado no prazo permitido. Quando tenta conceder a si,
   pessoa da Linha 2 ou papel de Qualidade aprovadora, então é negado e a tentativa é auditada.
5. **Gerente de área.** Dado gerente recém-admitido com escopo Área de Corte, quando consulta sua
   área e patrocina acesso de subordinada para uma linha de Corte, então pode fazê-lo conforme
   política. Quando tenta conceder diretamente ou consultar Linha de Envase sem atribuição, então
   é negado.
6. **Mudança de função.** Dada operadora transferida de Envase/Site Sul para Corte/Site Norte,
   quando novo gestor patrocina a mudança, então acesso antigo é revisado/encerrado e o novo só
   ativa após autorização e competência de Corte. Durante a transição, não há união implícita dos
   dois escopos.
7. **Cobertura temporária.** Dada técnica que cobrirá férias de 10 a 20/06, quando o administrador
   concede pacote e escopo temporários, então o líder a designa somente nesse intervalo. Em 21/06,
   tentativa de setup é negada, salvo nova atribuição válida.
8. **Desligamento eficaz.** Dado desligamento efetivo comunicado pela fonte de vínculo, quando a
   pessoa tenta nova ação após o instante definido, então é negada mesmo com sessão aberta; suas
   delegações também terminam e o histórico não é apagado.
9. **RH sem autoridade implícita.** Dado analista de RH que registrou admissão, quando tenta
   conceder Operador sem atribuição de provisionador, então é negado. Dado o mesmo analista com
   delegação formal de RH Operações para o Site Sul, então só efetiva pedidos aprovados no Sul.
10. **Terceirizada limitada.** Dada contratada com fim de contrato em 31/08, quando a data chega
    sem renovação validada, então seus papéis, designações e delegações expiram; o patrocinador
    não pode estendê-los apenas alterando a escala.
11. **Revisão periódica.** Dada atribuição de Operador sem uso ou próxima da revisão, quando o
    gestor recebe a revisão, então confirma, reduz ou pede revogação com motivo. Se não houver
    confirmação no prazo da política, a consequência configurada é aplicada e fica auditável.

Cada concessão, alteração de função, designação, suspensão, revogação e decisão de exceção deve
preservar fonte de vínculo, patrocinador, aprovador quando exigido, provisionador, escopo,
vigência e motivo. A separação mantém o princípio de não autoelevação de [06](06-regras-de-estado-e-segregacao.md)
e a revisão/auditoria de [07](07-identidades-delegacao-excecao-e-auditoria.md).
