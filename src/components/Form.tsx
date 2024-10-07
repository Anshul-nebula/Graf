import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useFetchServiceGraph } from "../hooks/useFetchGraph";
import { CleanParams, Graph ,GraphFilters} from '../types';

interface FormDrawerProps {
  onGraphChange: (graph: Graph) => void;
}

const getDefaultTimeRange = () => {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
};


const defaultDb = "flow_log";
const defaultTable = "service_graph";


const FormDrawer: React.FC<FormDrawerProps> = ({ onGraphChange }) => {
  const router = useRouter();
  const searchParams = useSearchParams();


  const [filters, setFilters] = useState<GraphFilters>({
    service: 'swiggy-listing-service-tier2',
    protocol: '',
    namespace: '',
    port: '',
    cluster: '',
    endpoint: ''
  });

  const [granularity, setGranularity] = useState('service');
  const [endpoint, setEndpoint] = useState('');
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [useRelativeTime, setUseRelativeTime] = useState(false);

  // const [url, setUrl] = useState<string | null>(null);
  const [queryData, setQueryData] = useState<CleanParams>({
    filters: {},
    granularity: '',
    start_time: '',
    end_time: '',
    db: defaultDb,
    table: defaultTable
  });

  const [relativeTime, setRelativeTime] = useState("15 minutes");
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };


  const handleGranularityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGranularity(e.target.value);
  };

  const calculateRelativeTime = (relative: string) => {
    const now = new Date();
    let calculatedStart: Date;

    switch (relative) {
      case "1 minute":
        calculatedStart = new Date(now.getTime() - 60000);
        break;
      case "5 minutes":
        calculatedStart = new Date(now.getTime() - 5 * 60000);
        break;
      case "15 minutes":
        calculatedStart = new Date(now.getTime() - 15 * 60000);
        break;
      case "1 hour":
        calculatedStart = new Date(now.getTime() - 60 * 60000);
        break;
      case "6 hours":
        calculatedStart = new Date(now.getTime() - 6 * 60 * 60000);
        break;
      case "12 hours":
        calculatedStart = new Date(now.getTime() - 12 * 60 * 60000);
        break;
      case "1 day":
        calculatedStart = new Date(now.getTime() - 24 * 60 * 60000);
        break;
      case "3 days":
        calculatedStart = new Date(now.getTime() - 3 * 24 * 60 * 60000);
        break;
      default:
        calculatedStart = new Date(now.getTime() - 15 * 60000);
    }

    return {
      start: calculatedStart.toISOString(),
      end: now.toISOString()
    };
  };


  const handleRelativeTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRelativeTime = e.target.value;
    setRelativeTime(selectedRelativeTime);
    const { start, end } = calculateRelativeTime(selectedRelativeTime);
    setStartTime(start);
    setEndTime(end);
  };

  const handleToggle = () => {
    setUseRelativeTime(!useRelativeTime);
  };

  const [graph, setGraph] = useState<Graph | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const defaultTimeRange = getDefaultTimeRange();
    const urlFilter = searchParams.get('filters') || "{\"service\":\"'swiggy-listing-service-tier2'\"}";
    const urlGranularity = searchParams.get('granularity') || "service";
    const urlStartTime = searchParams.get('start_time') || defaultTimeRange.start;
    const urlEndTime = searchParams.get('end_time') || defaultTimeRange.end;
    const urlEndpoint = searchParams.get('endpoint') || '';

    setGranularity(urlGranularity);
    setStartTime(urlStartTime);
    setEndTime(urlEndTime);
    setEndpoint(urlEndpoint);

    let parsedFilters: GraphFilters | null = null;

    try {
      parsedFilters = JSON.parse(decodeURIComponent(urlFilter));
      setFilters(parsedFilters as GraphFilters); 
    } catch (error) {
      console.error("Error parsing filter from URL:", error);
      setNotification("Error: Invalid filter in URL");
      setFilters({} as GraphFilters); 
    }
    
    

    const initialQueryData: CleanParams = {
      filters: parsedFilters,
      granularity: urlGranularity,
      start_time: urlStartTime,
      end_time: urlEndTime,
      db: defaultDb,
      table: defaultTable,
      endpoint: endpoint,
    };

    setQueryData(initialQueryData);

    if (!searchParams.toString()) {
      updateURL(initialQueryData);
    }

    fetchData(initialQueryData);
  }, [searchParams, router]);

  useEffect(() => {
    if (!graph) return;
    onGraphChange(graph);
  }, [graph]);

  useEffect(() => {
    try {
     
      const newQueryData: CleanParams = {
        filters: filters, 
        granularity: granularity,
        start_time: startTime,
        end_time: endTime,
        db: defaultDb,
        table: defaultTable,
        endpoint: endpoint,
      };

      setQueryData(newQueryData);
      console.log("newquery data :" ,newQueryData);
    } catch (error) {
      console.log("newquery data catch :" ,queryData);
      console.error("Error processing filters:", error);
      setNotification("Error: Invalid filter data-2");
      setTimeout(() => setNotification(null), 3000);
    }
  }, [filters, granularity, startTime, endTime]);
  
  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const updateURL = (data: CleanParams) => {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'filters') {
        params.set(key, encodeURIComponent(JSON.stringify(value)));
      } else if (value !== '') {
        params.set(key, value as string);
      }
    });
    router.push('?' + params.toString(), { scroll: false });
  };

  const fetchData = async (data: CleanParams) => {
    try {
      console.log(data);
      const response = await useFetchServiceGraph(data);
      setGraph(response);
      console.log(response);
  
      setGranularity(data.granularity);
      setStartTime(data.start_time);
      setEndTime(data.end_time);
  
      setFilters(data.filters); 
      console.log(JSON.stringify(data.filters, null, 2));
  
      setQueryData(data);
      updateURL(data);
  
      setNotification("Data fetched successfully!");
    } catch (error) {
      console.error('Error fetching service graph:', error);
      setNotification("Error fetching service graph");
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (event: React.FormEvent) => {

    event.preventDefault();

    const newQueryData: CleanParams = {
      filters: filters, 
      granularity: granularity,
      start_time: startTime,
      end_time: endTime,
      db: defaultDb,
      table: defaultTable
    };
    await fetchData(newQueryData);
  };

  return (
    <div className="fixed top-0 right-0 p-10 z-50">

      <button
        className="bg-gray-900 hover:bg-blue-900 text-white p-2 rounded-full shadow-lg flex items-center justify-center"
        onClick={handleOpen}>
        <span className="text-sm text-white px-2">Open Form</span>
      </button>

      {isOpen && (
        <div
          className="fixed right-10 top-24 w-full max-w-md bg-gray-700 text-white shadow-lg rounded-lg p-4 overflow-y-auto"
          style={{ maxHeight: '80vh' }}>

          <button
            className="absolute top-2 right-2 text-gray-300 hover:text-white"
            onClick={handleOpen}>
            &#x2715;
          </button>

          <h3 className="text-lg font-semibold mb-2">Form</h3>

          <form onSubmit={handleSubmit}>
            
              <h3 className="text-lg font-semibold mb-2">Filter</h3>
              <div className=" bg-gray-900 px-4 py-2 rounded-md mb-2">
                
                <div className="mb-4">
                <label className="block text-sm font-medium">Service</label>
                <input
                  type="text"
                  name="service"
                  value={filters.service}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full bg-gray-700 rounded-md"
                  placeholder="Enter Service"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium">Protocol</label>
                <input
                  type="text"
                  name="protocol"
                  value={filters.protocol}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full bg-gray-700 rounded-md"
                  placeholder="Enter Protocol"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium">Namespace</label>
                <input
                  type="text"
                  name="namespace"
                  value={filters.namespace}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full bg-gray-700 rounded-md"
                  placeholder="Enter Namespace"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium">Port</label>
                <input
                  type="text"
                  name="port"
                  value={filters.port}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full bg-gray-700 rounded-md"
                  placeholder="Enter Port"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium">Cluster</label>
                <input
                  type="text"
                  name="cluster"
                  value={filters.cluster}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full bg-gray-700 rounded-md"
                  placeholder="Enter Cluster"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium">Endpoint</label>
                <input
                  type="text"
                  name="endpoint"
                  value={filters.endpoint}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full bg-gray-700 rounded-md"
                  placeholder="Enter Endpoint"
                />
              </div>

              </div>
             
              <h3 className="text-lg font-semibold mb-2">Granularity</h3>
              <div className=" bg-gray-900 px-4 py-2 rounded-md mb-2">
                <div className="mb-4">
              
                
                <label className="block text-sm font-medium">Select Granularity</label>
                <select
                  className="mt-1 p-2 w-full bg-gray-700 rounded-md"
                  value={granularity}
                  onChange={(e) => setGranularity(e.target.value)}
                >
                  <option value="service">service</option>
                  <option value="api">API</option>
                </select>
              </div>

              {granularity === 'api' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium">Endpoint Details</label>
                  <input
                    type="text"
                    className="mt-1 p-2 w-full bg-gray-700 rounded-md"
                    placeholder="Enter Endpoint Details"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                  />
                </div>
              )}
              </div>

            <h3 className="text-lg font-semibold mb-2">Time</h3>
            <div className=" bg-gray-900 px-4 py-2 border-slate-100 rounded-md mb-2">
            <div className="mb-4">
              <label className="block text-sm font-medium">Time Mode</label>
              <button
                onClick={handleToggle}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-md"
              >
                {useRelativeTime ? "Switch to Absolute Time" : "Switch to Relative Time"}
              </button>
            </div>

            {useRelativeTime ? (
              <div className="mb-4">
                <label className="block text-sm font-medium">Relative Time</label>
                <select
                  className="mt-1 p-2 w-full bg-gray-700 rounded-md"
                  value={relativeTime}
                  onChange={handleRelativeTimeChange}
                >
                  <option value="1 minute">Last 1 minute</option>
                  <option value="5 minutes">Last 5 minutes</option>
                  <option value="15 minutes">Last 15 minutes</option>
                  <option value="1 hour">Last 1 hour</option>
                  <option value="6 hours">Last 6 hours</option>
                  <option value="12 hours">Last 12 hours</option>
                  <option value="1 day">Last 1 day</option>
                  <option value="3 days">Last 3 days</option>
                </select>
              </div>
            ) : (
              // Absolute Time Input
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium">Start Time (IST)</label>
                  <input
                    type="datetime-local"
                    className="mt-1 p-2 w-full bg-gray-700 rounded-md"
                    value={new Date(
                      new Date(startTime).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
                    )
                      .toISOString()
                      .slice(0, 16)}
                    onChange={(e) =>
                      setStartTime(
                        new Date(
                          new Date(e.target.value).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
                        ).toISOString()
                      )
                    }
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium">End Time (IST)</label>
                  <input
                    type="datetime-local"
                    className="mt-1 p-2 w-full bg-gray-700 rounded-md"
                    value={new Date(
                      new Date(endTime).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
                    )
                      .toISOString()
                      .slice(0, 16)}
                    onChange={(e) =>
                      setEndTime(
                        new Date(
                          new Date(e.target.value).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
                        ).toISOString()
                      )
                    }
                  />
                </div>
              </>
            )}
            </div>
            

            <div className="mt-4">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full w-full"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg">
          {notification}
        </div>
      )}
    </div>
  );
};

export default FormDrawer; 