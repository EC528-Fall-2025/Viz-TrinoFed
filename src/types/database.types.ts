export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  metadata: any;
}

export interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  rowCount: number;
  sizeBytes: number | null;
  metadata: any;
  firstSeen: string;
  lastSeen: string;
  totalQueries: number;
}

export interface DatabaseSchema {
  name: string;
  tables: DatabaseTable[];
  metadata: any;
  firstSeen: string;
  lastSeen: string;
  totalQueries: number;
}

export interface DatabaseCollection {
  name: string;
  documentCount?: number;
  sizeBytes?: number;
  fields?: DatabaseField[];
  metadata?: any;
  firstSeen: string;
  lastSeen: string;
  totalQueries: number;
}

export interface DatabaseField {
  name: string;
  type?: string;
  nested?: boolean;
  metadata?: any;
}

export interface Database {
  id: string;
  name: string;
  type: string;
  host: string | null;
  port: number | null;
  status: string;
  schemas: DatabaseSchema[];
  collections?: DatabaseCollection[]; // Add MongoDB collections support
  metadata: any;
  firstSeen: string;
  lastSeen: string;
  totalQueries: number;
}
