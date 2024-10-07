"use client";
import React from 'react';
import { useState } from 'react';
import ServiceGraphComponent from './ServiceGraphComponent';
import GeminiDrawer from './GeminiDrawer';
import { Graph } from '../types';
import FormDrawer from './Form';


const GraphLists = () => {
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [selectedGraph, setSelectedGraph] = useState<Graph | null>(null);

  const handleGraphFromForm = (graph: Graph) => {
    setSelectedGraph(graph);
  };

  const handleButtonClick = (index: number) => {
    setSelectedGraph(graphs[index]);
  };

  return (
    <div className="relative  h-screen">
        <div className="relative  h-screen">

          <ServiceGraphComponent initialData={selectedGraph as Graph} />
          <FormDrawer onGraphChange={handleGraphFromForm} />
          <GeminiDrawer selectedGraph={selectedGraph} />
        </div>
    </div>
  );
};

export default GraphLists;



//           <FormDrawer onGraphChange={handleGraphFromForm} />
//           <GeminiDrawer selectedGraph={selectedGraph} />