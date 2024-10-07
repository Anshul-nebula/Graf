import { ApiResponse, Graph, Node, Edge} from '../types';

export function calculateBorderColor(successRatio: number): string {
    const red = Math.round(255 * (1 - successRatio));
    const green = Math.round(255 * successRatio);
    return `rgb(${red}, ${green}, 0)`;
}

export function calculateEdgeThickness(latencyVariance: number): number {
    return Math.log(latencyVariance + 1) + 1;
}

export function transformApiResponse(apiResponse: ApiResponse, granularity: string): Graph {
    const transformNode = (node: any): Node => {
      const transformedNode : Node = {
        id: node.id,
        title: node.title,
      };

      if (node.subtitle) transformedNode.subtitle = node.subtitle;
      if (node.detail__clusters) transformedNode.clusters = node.detail__clusters;
      if (node.detail__namespaces) transformedNode.namespaces = node.detail__namespaces;
      if (node.detail__service) transformedNode.service = node.detail__service;
      if (node.detail__protocol) transformedNode.protocol = node.detail__protocol;
      if (node.detail__addresses) transformedNode.addresses = node.detail__addresses;
      if (node.detail__endpoint) transformedNode.endpoint = node.detail__endpoint;
      if (node.mainstat !== undefined) transformedNode.in = node.mainstat;
      if (node.secondarystat !== undefined) transformedNode.out = node.secondarystat;

      return transformedNode;
    };

    const transformEdge = (edge: any): Edge => {
      const transformedEdge: Edge = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
      };

      if (edge.mainstat !== undefined) transformedEdge.numRequests = edge.mainstat;
      if (edge.secondarystat !== undefined) transformedEdge.avgRRT = edge.secondarystat;

      return transformedEdge;
    };

    return {
      type: granularity === 'service' ? 'service' : 'api',
      nodes: apiResponse.result.nodes.map(transformNode),
      edges: apiResponse.result.edges.map(transformEdge),
    };
  }
