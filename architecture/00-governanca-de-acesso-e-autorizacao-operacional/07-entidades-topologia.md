# Módulo `operational-topology` — entidades, regras e features

## Papel no requisito

Este módulo mínimo oferece a árvore física autorizável — tenant → empresa legal/site → área → linha → célula/centro → ativo. Ele não modela processo, telemetria ou manutenção; fornece contexto confiável para restringi-los quando existirem.

**Fontes:** [produto 00, “Premissas vinculantes”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/00-visao-e-fronteiras.md), [produto 02, “Escopo e herança”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md) e [produto 05, “Tipos de escopo”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md).

## Entidades e features

| Entidade | Responsabilidade no requisito | Features que a criam ou mudam |
|---|---|---|
| `OperationalNode` | Local/ativo autorizado e seu lugar na hierarquia tenant-local. | `register-node`, `move-node`, `inactivate-node`, resolução de escopo descendente |
| `TopologyChange` | Evidência de mudança que pode afetar grants e designações futuros. | `move-node` |

`AssetProfile` é valor do nó `ASSET`: informa criticidade, competência e se a operação exige designação explícita.

## Contratos `entity/`

Os IDs são aliases de arquivos irmãos de `entity/`; o módulo recebe referências externas como primitivos pela `application`, sem import de `@shared`.

```ts
export type TenantId = string;
export type TenantMemberId = string;
export type TopologyNodeId = string;

export const OPERATIONAL_NODE_TYPE = {
  LEGAL_ENTITY: "legal_entity", SITE: "site", AREA: "area", LINE: "line",
  CELL: "cell", WORK_CENTER: "work_center", ASSET: "asset",
} as const;
export type OperationalNodeType = (typeof OPERATIONAL_NODE_TYPE)[keyof typeof OPERATIONAL_NODE_TYPE];
export const OPERATIONAL_NODE_STATUS = { ACTIVE: "active", INACTIVE: "inactive", RETIRED: "retired" } as const;
export type OperationalNodeStatus = (typeof OPERATIONAL_NODE_STATUS)[keyof typeof OPERATIONAL_NODE_STATUS];
export interface AssetProfileInterface {
  assetClass: string; criticality: "low" | "medium" | "high" | "critical";
  requiresDesignatedOperator: boolean; requiredCompetencyCodes: readonly string[];
}
export interface OperationalNodeEntityInterface {
  id: TopologyNodeId; tenantId: TenantId; type: OperationalNodeType; status: OperationalNodeStatus;
  code: string; name: string; parentNodeId?: TopologyNodeId; ancestorNodeIds: readonly TopologyNodeId[];
  assetProfile?: AssetProfileInterface; effectiveFrom: Date; effectiveUntil?: Date; createdAt: Date; updatedAt: Date;
}
export interface TopologyChangeEntityInterface {
  id: string; tenantId: TenantId; nodeId: TopologyNodeId; previousParentNodeId?: TopologyNodeId;
  currentParentNodeId?: TopologyNodeId; changedByMemberId: TenantMemberId; reason: string; effectiveAt: Date;
}
```

## Regras implementáveis

- Toda leitura e mutação recebe `tenantId` antes do ID do nó; nó, pai e ancestrais pertencem ao mesmo tenant. Assim um identificador direto não revela ativo de outro tenant ([produto 02, “Decisão de acesso”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md)).
- `register-node` aceita somente pai/tipo compatíveis; `ancestorNodeIds` é derivado no domínio e jamais confiado à API. A persistência mantém closure table tenant-local para resolver descendência ([produto 02, “Escopo e herança”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md)).
- `move-node` atualiza subárvore e `TopologyChange` em transação, então agenda revisão de grants/designações afetados. Não reescreve o local preservado em fatos históricos ([produto 02, “Escopo e herança”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/02-modelo-de-autorizacao-contextual.md)).
- Grant em nó cobre somente descendentes atuais permitidos; grant em ativo não mostra irmãos. Nó inativo/retirado falha como contexto de nova operação ([produto 05, “Tipos de escopo”](../../product/01-governanca-de-acesso-e-autorizacao-operacional/05-atribuicoes-escopos-e-ativos.md)).
