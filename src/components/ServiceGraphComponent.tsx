"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Graph, Node, Edge } from '../types';
import * as d3 from 'd3';


interface ServiceGraphProps {
  initialData: Graph | null;
}

const capitalizeFirstLetter = (string: string | undefined) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};
// http://localhost:3000?query={"db":"flow_log","table":"service_graph","filters":{"cluster":"'__any'","namespace":"'__any'","service":"'swiggy-listing-service-tier2'","protocol":"'__any'","port":"'0'","endpoint":""},"granularity":"service","startTime":"2024-09-24T08:25:04.964Z","endTime":"2024-09-24T08:40:04.964Z"}

const ServiceGraphComponent = ({ initialData }: ServiceGraphProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [data, setData] = useState<Graph | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);


  const formatNumber = (num: number) => num.toFixed(2);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    setData(initialData);
    window.addEventListener('resize', updateDimensions);
    updateDimensions();


    return () => window.removeEventListener('resize', updateDimensions);
  }, [initialData]);



  useEffect(() => {
    if (!svgRef.current || !data || dimensions.width === 0 || dimensions.height === 0) return;
     console.log("hello  data: ", data);
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const nodeRadius = 70;
    svg.attr('width', dimensions.width).attr('height', dimensions.height);

    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-10 -10 20 20")
      .attr("refX", 0)
      .attr("refY", 0)
      .attr("markerWidth", 40)
      .attr("markerHeight", 70)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M-6,-6 L 0,0 L -6,6")
      .attr("fill", "#4B5563");

    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.edges).id((d: any) => d.id).distance(300))
      .force('charge', d3.forceManyBody().strength(-3000))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(nodeRadius));

    const graph = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('start', () => {
        svg.style('cursor', 'grab');
      })
      .on('zoom', (event) => {
        svg.style('cursor', 'pointer');
        graph.attr('transform', event.transform);
      })
      .on('end', () => {
        svg.style('cursor', 'pointer');
      });

    svg.call(zoom as any);

    const edges = graph.selectAll('.edge')
      .data(data.edges)
      .enter().append('g')
      .attr('class', 'edge');

    edges.append('line')
      .style('stroke', '#4B5563')
      .style('stroke-opacity', 0.7);

    edges.append('line')
      .style('stroke', 'none')
      .attr('marker-end', 'url(#arrowhead)');



    const edgeLabels = graph.selectAll('.edge-label')
      .data(data.edges)
      .enter().append('text')
      .attr('class', 'edge-label')
      .attr('text-anchor', 'middle')
      .attr('dy', -7)
      .style('font-size', '10px')
      .style('fill', '#E5E7EB')
      .text((d: Edge) => {
        const calls = d.numRequests ? d.numRequests : 'N/A';
        const latency = d.avgRRT ? ', ' + formatNumber(d.avgRRT / 1000) + 'ms' : '0';
        return `${calls} calls ${latency}`;
      })
      .on('click', function (event, d) {
        const [x, y] = d3.pointer(event, svg.node());
        setTooltip({
          x,
          y,
          content: `Calls: ${(d.numRequests ? d.numRequests : 'N/A')} \nLatency: ${d.avgRRT ? '' + formatNumber(d.avgRRT / 1000) + 'ms' : '0'}`,
        });
      });

    const nodeGroups = graph.selectAll('.node')
      .data(data.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    nodeGroups.append('circle')
      .attr('r', nodeRadius)
      .style('fill', '#1F2937')
      .style('stroke', '#4B5563')
      .style('stroke-width', 5);

    nodeGroups.append('image')
      .attr('xlink:href', (d: Node) => {
        switch (d.protocol) {
          case 'Redis':
            return '../img/redis.png';
          case 'HTTP_TLS':
            if (d.title.toLowerCase().includes('kafka')) {
              return '../img/kafka.png';
            } else if (d.title.toLowerCase().includes('dynamodb')) {
              return '../img/dynamodb.png';
            } else if (d.title.toLowerCase().includes('elasticexpress')) {
              return '../img/elasticexpress.png';
            } else if (d.title.toLowerCase().includes('kinesis')) {
              return '../img/kinesis.png';
            } else if (d.title.toLowerCase().includes('sqs')) {
              return '../img/sqs.png';
            } else if (d.title.toLowerCase().includes('http')){
              return '../img/http.png';
            }
            else {
              return '../img/http.png';
            }

          case 'gRPC':
            return '../img/grpc.png';
          case 'MySQL':
            return '../img/mysql.png';
          case 'MongoDB':
            return '../img/mongodb.png';
          default:
            return '../img/default.png';
        }
      })
      .attr('x', -nodeRadius * 0.9)
      .attr('y', -nodeRadius * 0.9)
      .attr('width', nodeRadius * 1.8)
      .attr('height', nodeRadius * 1.8);

    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .style('font-size', '12px')
      .style('fill', '#E5E7EB')


    nodeGroups.append('foreignObject')
      .attr('width', 110)
      .attr('height', 50)
      .attr('x', -55)
      .attr('y', 0)
      .append('xhtml:div')
      .style('width', '100%')
      .style('height', '100%')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('text-align', 'center')
      .style('font-size', '12px')
      .style('color', '#E5E7EB')
      .style('overflow', 'hidden')
      .style('word-wrap', 'break-word')
      .style('text-wrap', 'normal')
      .html((d: Node) => d.title);

    // nodeGroups.append('title')
    //   .text((d: ServiceNode) => `${d.name}\nPort: ${d.port}\nNamespace: ${d.k8sNamespace}\nCluster: ${d.k8sCluster}\nnumRequests: ${d.totalnumRequests}`);


    simulation.on('tick', () => {
      edges.each(function (d: any) {
        const edge = d3.select(this);
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;

        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const sourcePerimeterX = sourceX + (dx * nodeRadius) / distance;
        const sourcePerimeterY = sourceY + (dy * nodeRadius) / distance;
        const targetPerimeterX = targetX - (dx * nodeRadius) / distance;
        const targetPerimeterY = targetY - (dy * nodeRadius) / distance;

        const thickness = d.avgRRT ? Math.log(d.avgRRT) + 1 : 2;

        const arrowLength = 10;
        const edgeEndX = targetPerimeterX - (dx * arrowLength) / distance;
        const edgeEndY = targetPerimeterY - (dy * arrowLength) / distance;

        edge.select('line')
          .attr('x1', sourcePerimeterX)
          .attr('y1', sourcePerimeterY)
          .attr('x2', edgeEndX)
          .attr('y2', edgeEndY)
          .style('stroke-width', thickness);

        edge.select('line[marker-end]')
          .attr('x1', edgeEndX)
          .attr('y1', edgeEndY)
          .attr('x2', targetPerimeterX)
          .attr('y2', targetPerimeterY)
          .style('stroke-width', 1);
      });

      nodeGroups.attr('transform', (d: any) => `translate(${d.x},${d.y})`);

      edgeLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2)
        .attr('transform', (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          let angle = Math.atan2(dy, dx) * 180 / Math.PI;
          if (angle > 90 || angle < -90) {
            angle += 180;
          }
          const midX = (d.source.x + d.target.x) / 2;
          const midY = (d.source.y + d.target.y) / 2;
          return `rotate(${angle}, ${midX}, ${midY})`;
        })
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'middle');
    });

    function dragstarted(event: any, d: any) {
      svg.style('cursor', 'grabbing');
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;

      setTooltip(prev => prev ? { ...prev, x: d.fx, y: d.fy } : null);
    }

    function dragended(event: any, d: any) {
      svg.style('cursor', 'grab');
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    nodeGroups
      .on('click', function (event, d) {
        d3.select(this).select('circle').transition()
          .duration(300)
          .attr('r', nodeRadius + 5);

        const [x, y] = d3.pointer(event, svg.node());
        const content = Object.entries(d)
          .filter(([key, value]) =>
            !['id', 'x', 'y', 'vx', 'vy', 'index', 'fx', 'fy'].includes(key) &&
            value !== undefined
          )
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        const remToPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const offset = 7 * remToPx;

        setTooltip({ x: (d.x ?? 0) + offset, y: d.y ?? 0, content });
      })

      .on('mouseout', function () {
        svg.style('cursor', 'default');
        d3.select(this).select('circle').transition()
          .duration(300)
          .attr('r', nodeRadius);

      });


    svg.on('mouseover', () => {
      svg.style('cursor', 'pointer');

    });

    svg.on('mouseout', () => {
      svg.style('cursor', 'default');
    });

    svg.on('mouseup', () => {
      svg.style('cursor', 'default');
    });
    nodeGroups.attr('transform', (d: any) => `translate(${d.x},${d.y})`);


    nodeGroups.selectAll('text')
      .attr('x', 0)
      .attr('y', (d) => 80);


  }, [data, dimensions, initialData]);

  return (
    <div className="p-6 h-screen w-screen bg-gray-950 text-gray-100">
      <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden w-full h-full">
        <header className="bg-gray-800 p-8">
          <h1 className="text-2xl font-bold text-gray-100">{data ? data.type === 'service' ? 'Service Graph' : 'API Graph' : 'Graph Loading...'}</h1>
          <h1 className="text-2xl font-bold text-gray-100">{data?.nodes.length === 0 ? "Graph is empty" : ''}</h1>

        </header>
        <main className="flex h-[calc(100%-4rem)]">
          <div className="border-r border-gray-700 p-4 w-full h-full">
            <svg
              ref={svgRef}
              className="w-full h-full rounded-lg bg-gray-900"
            ></svg>

            {tooltip && (
              <div
                className="absolute bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-xs w-64"
                style={{ top: `${tooltip.y}px`, left: `${tooltip.x}px` }}
              >
                <button
                  onClick={() => setTooltip(null)}
                  className="absolute top-2 right-2 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors duration-200"
                >
                  &times;
                </button>
                <div className="mt-5 space-y-2">
                  {tooltip.content.split('\n').map((line, index) => {
                    const [title, data] = line.split(':');
                    const formattedTitle = title.trim().toLowerCase();
                    const formattedData = data ? data.trim() : '';

                    if (!formattedData) return null;

                    const isService = formattedTitle === 'service';
                    const isEndpoint = formattedTitle === 'endpoint';

                    const currentUrl = new URL(window.location.href);
                    const params = new URLSearchParams(currentUrl.search);

                    let filtersString = params.get('filters');
                    let filters = filtersString ? JSON.parse(decodeURIComponent(filtersString)) : {};

                    if (isService) {
                      filters.service = `'${formattedData}'`;
                    } else if (isEndpoint) {
                      filters.endpoint = `'${formattedData}'`;
                    }

                    const updatedFiltersString = encodeURIComponent(JSON.stringify(filters));
                    params.set('filters', updatedFiltersString);

                    const updatedUrl = `${currentUrl.origin}${currentUrl.pathname}?${params.toString()}`;

                    return (
                      <div key={index} className="bg-gray-700 p-2 rounded">
                        <strong className="block text-xs text-gray-300 truncate">{capitalizeFirstLetter(title.trim())}</strong>
                        <span className="block text-sm break-words">
                          {(isService || isEndpoint) ? (
                            <a href={updatedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors duration-200">
                              {formattedData}
                            </a>
                          ) : (
                            formattedData
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}



          </div>
        </main>
      </div>
    </div>

  );
};
export default ServiceGraphComponent;

