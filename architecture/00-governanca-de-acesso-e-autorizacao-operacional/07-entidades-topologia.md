# Entidades TypeScript — módulo `operational-topology`

O módulo é propositalmente pequeno neste requisito: fornece árvore física autorizável e o ativo é
um nó especializado. Processo, telemetria e manutenção serão modelados por seus domínios futuros.

```ts
import type { TenantId, TopologyNodeId } from "@shared/access/authorization.types";

export const OPERATIONAL_NODE_TYPE = {
  LEGAL_ENTITY: "legal_entity", SITE: "site", AREA: "area", LINE: "line",
  CELL: "cell", WORK_CENTER: "work_center", ASSET: "asset",
} as const;
export type OperationalNodeType =
  (typeof OPERATIONAL_NODE_TYPE)[keyof typeof OPERATIONAL_NODE_TYPE];

export const OPERATIONAL_NODE_STATUS = {
  ACTIVE: "active", INACTIVE: "inactive", RETIRED: "retired",
} as const;
export type OperationalNodeStatus =
  (typeof OPERATIONAL_NODE_STATUS)[keyof typeof OPERATIONAL_NODE_STATUS];

export interface AssetProfileInterface {
  assetClass: string;
  criticality: "low" | "medium" | "high" | "critical";
  requiresDesignatedOperator: boolean;
  requiredCompetencyCodes: readonly string[];
}

export interface OperationalNodeEntityInterface {
  id: TopologyNodeId;
  tenantId: TenantId;
  type: OperationalNodeType;
  status: OperationalNodeStatus;
  code: string;
  name: string;
  parentNodeId?: TopologyNodeId;
  ancestorNodeIds: readonly TopologyNodeId[];
  assetProfile?: AssetProfileInterface;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TopologyChangeEntityInterface {
  id: string;
  tenantId: TenantId;
  nodeId: TopologyNodeId;
  previousParentNodeId?: TopologyNodeId;
  currentParentNodeId?: TopologyNodeId;
  changedByMemberId: string;
  reason: string;
  effectiveAt: Date;
}
```

`ancestorNodeIds` é derivado, não aceito da API. A persistência mantém também uma closure table
tenant-local para resolver herança de escopo sem varrer a árvore. Mover um nó atualiza a subárvore
em transação, registra `TopologyChange` e agenda revisão dos grants/designações afetados. Fatos
operacionais futuros guardarão snapshot de `ResourceContext`, logo mover ativo nunca reescreve
local/autorização histórica.
