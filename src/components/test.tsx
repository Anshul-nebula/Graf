// "use client";
//
// import { useState } from 'react';
// import ServiceGraphComponent from './ServiceGraphComponent';
// import GeminiDrawer from './GeminiDrawer';
// import { Graph } from '../types/types';
// import FormDrawer from './Form';
// import React from 'react';
//
// const GraphLists = () => {
//   const [graphs, setGraphs] = useState<Graph[]>([]);
//   const [selectedGraph, setSelectedGraph] = useState<Graph | null>(null);
//
//   const handleGraphFromForm = (graph: Graph) => {
//
//     setSelectedGraph(graph);
//   };
//
//   const handleButtonClick = (index: number) => {
//     setSelectedGraph(graphs[index]);
//   };
//
//   return (
//     <div className="relative  h-screen">
//       <ServiceGraphComponent initialData={selectedGraph as Graph} />
//       <FormDrawer onGraphChange={handleGraphFromForm} />
//       <div className="absolute bottom-0 left-0 right-12 p-10 flex justify-left">
//         <div className="flex flex-wrap gap-4">
//         </div>
//       </div>
//
//       <GeminiDrawer selectedGraph={selectedGraph} />
//       hellooooo
//     </div>
//   );
// };
//
// export default GraphLists;
//
//
