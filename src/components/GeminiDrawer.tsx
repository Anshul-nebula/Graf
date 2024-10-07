"use client";

import { useState} from "react";
import Image from 'next/image';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Lottie from 'lottie-react';
import loadingAnimation from '../animation/loading.json';
import AI from '../img/AIicon.png';
import React from "react";
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;
import {Graph} from '../types';
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

interface GeminiDrawerProps {
  selectedGraph:Graph | null;
}

const GeminiDrawer: React.FC<GeminiDrawerProps> = ({ selectedGraph }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [formattedText, setFormattedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsLoading(true);
      if (selectedGraph) {
        await fetchGeminiResponse(generatePrompt(selectedGraph));
      } else {
        setResponseText("Error: No graph data available.");
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResponseText("");
    setFormattedText(null);
  };

  const fetchGeminiResponse = async (input: string) => {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(input);
    const rawText = await result.response.text();
    setResponseText(rawText);
    setFormattedText(formatResponse(rawText));
    setIsLoading(false);
  };

  const generatePrompt = (graph: Graph): string => {
    if (!graph || !graph.nodes || !graph.edges ) return "Invalid graph data";

    const nodesInfo = graph.nodes.map((node) => {
      return `Node: ${node.title} (Service: ${node.service || 'N/A'}, Service Protocol: ${node.protocol || 'N/A'}, Service Address(es): ${node.addresses || 'N/A'}, API(s): ${node.endpoint || 'N/A'}) in Namespace(s): ${node.namespaces || 'N/A'}, part of ${node.clusters || 'N/A'} cluster, handled ${node.in || 0} requests (IN) and ${node.out || 0} requests (OUT).`;
    }).join("\n");

    const edgesInfo = graph.edges.map((edge) => {
      return `Edge from ${edge.source} to ${edge.target} processed ${edge.numRequests || 0} requests with an average round trip time of ${edge.avgRRT || 0} microseconds.`;
    }).join("\n");


    return `
    You are an AI specialized in analyzing graph data. Given the following nodes and edges data, provide a detailed explanation of the  service architecture, focusing on identifying potential issues based on the connections within the graph.  If there are no potential issues then don't show it's heading. Highlight key problems related to latency, performance, or other relevant metrics, and categorize the issues into Critical, Warning, and Notes.

    **Input Data:**
    Nodes:
    ${nodesInfo}

    Connections (Edges):
    ${edgesInfo}

    **Output Requirements:**
    1. Describe the service architecture highlighting dependencies between components in bullet points.
    2. Identify potential issues or bottlenecks based on the graph structure, such as isolated nodes, high-degree nodes, cycles, latency, or performance issues.
    3. Categorize each issue into one of the following:
       - **Critical:** Major problems affecting the performance or availability of the system.
       - **Warning:** Issues that may cause problems in the near future but are not immediately critical.
       - **Notes:** Observations or minor concerns that do not currently affect the system but are worth mentioning.
    4. Ensure that the explanation is clear and concise, avoiding technical jargon where possible.
    5. Please Don't write conclusion in the end.

     Please provide your analysis based on the above criteria.
    `;
  };

  const formatResponse = (text: string): string => {
    let formatted = text
      .replace(/^### (.*$)/gim, "<h3 style='font-weight: bold; margin-top: 1.5rem;'>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2 style='font-weight: bold; margin-top: 2rem;'>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1 style='font-weight: bold; margin-top: 2.5rem;'>$1</h1>")
      .replace(/\n\n+/g, "</p><p style='margin-top: 1rem;'>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>")
      .replace(/^\* (.*)$/gim, "<li style='margin-bottom: 1rem;'>◉ $1</li>")
      .replace(/<\/li><br><li>/g, "</li><li>")
      .replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>")
      .replace(/^\s*\d+\.\s+(.*)$/gim, "<ol><li>$1</li></ol>")
      .replace(/Critical:/g, "<h3 style='color: red; font-weight: bold;'>Critical:</h3>")
      .replace(/Warning:/g, "<h3 style='color: orange; font-weight: bold;'>Warning:</h3>")
      .replace(/Notes:/g, "<h3 style='color: #90EE90; font-weight: bold;'>Notes:</h3>");

    formatted = formatted.replace(/<\/ul><ul>/g, "");

    return `<p>${formatted}</p>`;
  };

  return (
    <div className="fixed bottom-0 right-0 p-10 z-50">
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center"
        onClick={handleOpen}
      >
        <Image src={AI} alt="AI Icon" width={32} height={32} />
        <span className=" ml-3 text-sm text-white">NebulaIQ AI</span>
      </button>



      {isOpen && (
        <div
          className="fixed right-10 bottom-24 w-full max-w-md bg-gray-800 text-white shadow-lg rounded-lg p-4 overflow-y-auto"
          style={{ maxHeight: '80vh' }}
>
          <button
            className="absolute top-2 right-2 text-gray-300 hover:text-white"
            onClick={handleClose}>

          </button>

          <h3 className="text-lg font-semibold mb-2">Graph Description</h3>

          {isLoading ? (
            <Lottie animationData={loadingAnimation} loop={true} style={{ width: '100px', height: '100px', margin: '0 auto' }} />
          ) : (
            <>
              <div
                className="prose prose-invert"
                dangerouslySetInnerHTML={{ __html: formattedText || responseText }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GeminiDrawer;


