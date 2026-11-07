export type Severity = 'BREAKING' | 'SAFE';

export interface Change {
  id: string;
  severity: Severity;
  kind: string;
  method: string;
  path: string;
  location: string;
  field: string;
  detail: string;
}

export interface DetectOutput {
  engine: string;
  changes: Change[];
}

export interface Finding {
  changeId: string;
  service: string;
  owner: string;
  file: string;
  line: number;
  snippet: string;
}

export interface ClearService {
  changeId: string;
  service: string;
  owner: string;
}

export interface UsageScanOutput {
  findings: Finding[];
  clear: ClearService[];
}

export interface ServiceMapConfig {
  currency: string;
  services: Record<
    string,
    {
      owner: string;
      path: string;
      revenue_per_hour: number;
      criticality: string;
    }
  >;
}

export interface CostServiceResult {
  service: string;
  owner: string;
  criticality: string;
  per_hour: number;
  estimated_loss: number;
}

export interface CostOutput {
  currency: string;
  assumed_outage_hours: number;
  services: CostServiceResult[];
  total_estimated_loss: number;
}
