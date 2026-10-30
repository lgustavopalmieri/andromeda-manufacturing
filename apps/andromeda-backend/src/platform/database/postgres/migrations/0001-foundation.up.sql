CREATE TABLE tenants (
    id text CONSTRAINT tenants_pkey PRIMARY KEY,
    code text NOT NULL
);

CREATE TABLE actors (
    id text CONSTRAINT actors_pkey PRIMARY KEY,
    name text NOT NULL,
    kind text NOT NULL CONSTRAINT actors_kind_check CHECK (kind IN ('human', 'service', 'agent')),
    status text NOT NULL CONSTRAINT actors_status_check CHECK (status IN ('active', 'inactive')),
    owner_actor_id text,
    CONSTRAINT actors_owner_actor_fk FOREIGN KEY (owner_actor_id) REFERENCES actors (id)
);

CREATE TABLE tenant_memberships (
    tenant_id text NOT NULL,
    actor_id text NOT NULL,
    status text NOT NULL CONSTRAINT tenant_memberships_status_check CHECK (status IN ('active', 'suspended', 'removed')),
    CONSTRAINT tenant_memberships_pkey PRIMARY KEY (tenant_id, actor_id),
    CONSTRAINT tenant_memberships_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT tenant_memberships_actor_fk FOREIGN KEY (actor_id) REFERENCES actors (id)
);

CREATE TABLE locations (
    id text CONSTRAINT locations_pkey PRIMARY KEY,
    tenant_id text NOT NULL,
    code text NOT NULL,
    kind text NOT NULL CONSTRAINT locations_kind_check CHECK (kind IN ('plant', 'area', 'line', 'warehouse')),
    parent_location_id text,
    CONSTRAINT locations_tenant_id_key UNIQUE (tenant_id, id),
    CONSTRAINT locations_tenant_code_key UNIQUE (tenant_id, code),
    CONSTRAINT locations_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT locations_parent_fk FOREIGN KEY (tenant_id, parent_location_id) REFERENCES locations (tenant_id, id)
);

CREATE TABLE machines (
    id text CONSTRAINT machines_pkey PRIMARY KEY,
    tenant_id text NOT NULL,
    code text NOT NULL,
    location_id text NOT NULL,
    CONSTRAINT machines_tenant_id_key UNIQUE (tenant_id, id),
    CONSTRAINT machines_tenant_code_key UNIQUE (tenant_id, code),
    CONSTRAINT machines_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT machines_location_fk FOREIGN KEY (tenant_id, location_id) REFERENCES locations (tenant_id, id)
);

CREATE INDEX actors_owner_actor_id_idx ON actors USING btree (owner_actor_id);
CREATE INDEX tenant_memberships_actor_id_idx ON tenant_memberships USING btree (actor_id);
CREATE INDEX locations_tenant_parent_location_id_idx ON locations USING btree (tenant_id, parent_location_id);
CREATE INDEX machines_tenant_location_id_idx ON machines USING btree (tenant_id, location_id);
