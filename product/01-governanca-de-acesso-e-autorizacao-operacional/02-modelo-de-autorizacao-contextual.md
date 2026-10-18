# Modelo de autorização contextual

## Decisão de acesso

Uma solicitação é autorizada somente se **todas** as condições abaixo forem verdadeiras:

1. a identidade está autenticada, ativa e vinculada ao tenant selecionado;
2. ela possui a permissão exata para a operação pedida, por papel ou concessão excepcional;
3. o recurso pertence ao mesmo tenant e está dentro de pelo menos um escopo ativo da concessão;
4. o estado do recurso permite a operação e todas as pré-condições operacionais foram atendidas;
5. turno, horário, competência, certificação, designação de ativo e política local, se exigidos,
   estão válidos; e
6. não há bloqueio de segurança, qualidade, segregação de funções, expiração ou revogação.

Ausência de permissão é negação. Uma tela, URL, identificador direto, exportação, integração ou
ação de HMI não substitui essa decisão. A mesma regra vale antes de revelar metadados que possam
confirmar a existência de recurso fora do escopo.

## Regras estruturantes

- O tenant é a fronteira máxima: uma atribuição nunca alcança outro tenant, nem para auditoria,
  suporte, integração, agente ou Owner.
- A pessoa que participa de mais de um tenant possui atribuições independentes e escolhe o contexto
  ativo; papéis de um tenant não se combinam com os de outro.
- Permissões podem se somar; uma suspensão, revogação, bloqueio de estado ou regra obrigatória de
  segregação sempre prevalece sobre a soma.
- Ver, listar, pesquisar, exportar, criar, editar rascunho, submeter, aprovar, publicar, operar,
  corrigir, administrar e excluir/retirar são operações diferentes.
- Um papel é um preset revisável. A autorização efetiva vem da atribuição contextual, não do nome
  do papel e nem da posição hierárquica da pessoa.
- Objetos configuráveis usam versão, estado e vigência. Editar rascunho não autoriza alterar versão
  vigente, execução em curso ou evidência histórica.

## Escopo e herança

O escopo físico segue a hierarquia configurada: tenant → empresa legal (quando usada) → site →
área → linha/processo → célula/centro de trabalho → ativo. Concessão em um nó abrange seus filhos
atuais, salvo exclusões permitidas pela política. Concessão em ativo não revela os demais ativos do
mesmo local.

Todo evento e registro operacional preserva tenant, local/ativo, ordem e contexto vigentes quando
o fato ocorreu. Se uma máquina for transferida de linha, fatos novos usam o novo local; consulta do
histórico respeita o contexto registrado, sem reescrever evidência para ampliar acesso.

Além do escopo físico, concessão pode limitar objeto identificado (Integração ERP Brasil), família
de produto, turno, equipe, ação do HMI ou tipo de informação. O limite específico não cria acesso
implícito a irmãos ou objetos semelhantes.

## Estado, capacidade e efeito

Permissão não torna uma ação possível: iniciar ordem ainda requer ordem liberada/preparada, ativo
apto, material/qualidade/EHS conformes e contrato de HMI aplicável. Bloqueio de qualidade não é
removido por permissão de produção. A resposta informa sucesso, recusa por política, pré-condição
pendente, timeout ou falha, sem expor dado protegido.
