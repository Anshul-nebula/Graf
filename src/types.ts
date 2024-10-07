type SeriesSize = 'sm' | 'md' | 'lg';

export interface SimpleOptions {
  text: string;
  showSeriesCount: boolean;
  seriesCountSize: SeriesSize;
}


export interface Node {
  id: string;
  title: string;
  subtitle?: string;
  clusters?: string;
  namespaces?: string;
  service?: string;
  protocol?: string;
  addresses?: string;
  endpoint?: string;
  in?: number; // Mainstat
  out?: number; // Secondarystat,
  x?: number;
  y?: number;

}

export interface Edge {
  id: string;
  source: string;
  target: string;
  numRequests?: number; // Mainstat
  avgRRT?: number; // Secondarystat
}


export interface Graph {
  type: 'service' | 'api'
  nodes: Node[];
  edges: Edge[];
}

export interface ApiNode {
  id: string;
  title: string;
  detail__service?: string;
  detail__clusters?: string;
  detail__namespaces?: string;
  detail__addresses: string;
  detail__protocol?: string;
  mainstat?: number;
  secondarystat?: number;
}

export interface ApiEdge {
  id: string;
  source: string;
  target: string;
  mainstat?: number;
  secondarystat?: number;
}

export interface ApiResponse {
  OPT_STATUS: string;
  DESCRIPTION: string;
  result: {
      nodes: ApiNode[];
      edges: ApiEdge[];
  };
  debug: null;
}

export interface InputData {
    status: number;
    results: Array<{
      name: string;
      frames: Array<{
        schema: {
          name: string;
          fields: Array<{
            name: string;
            config: {
              displayName: string;
            };
          }>;
        };
        data: {
          values: any[][];
        };
      }>;
    }>;
  }

export interface CleanParams {
  filters:any;
  granularity: string;
  start_time: string;
  end_time: string;
  db: string;
  table: string;
  endpoint?: string;
}


export interface GraphFilters{
  service : string;
  protocol : string;
  namespace: string;
  port : string;
  cluster : string;
  endpoint : string;

}
