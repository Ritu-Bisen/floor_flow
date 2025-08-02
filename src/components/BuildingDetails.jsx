import React, { useEffect, useState } from "react";
import { ArrowLeft, Building2, Eye, Loader2Icon } from "lucide-react";
import axios from "axios";

const BuildingDetails = ({ building, onNavigateToFloor, onBack }) => {
  const [floorData, setFloorData] = useState([]);
  const [loadingGetFloorData, setLoadingGetFloorData] = useState(false);

  useEffect(() => {
    const SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbzlbHC7RwSjI7pF-OYWm5XuuRXt0LWtRbYjR-sccT59UwcqQMKOKfN8d2pMyRjDFmVS/exec";

    async function fetchData() {
      try {
        const serial = encodeURIComponent(building["Serial No."]);
        const name = encodeURIComponent(building["Budling Name"]);

        setLoadingGetFloorData(true);
        const res = await axios.get(
          `${SCRIPT_URL}?action=fetchBuildingFloors&serialNo=${serial}&buildingName=${name}`
        );

        if (res.data.success) {
          setFloorData(res.data.data);
        } else {
          console.error("Unexpected response:", res.data);
        }
      } catch (err) {
        console.error("Failed to fetch floor data", err);
      } finally {
        setLoadingGetFloorData(false);
      }
    }

    fetchData();
  }, [building]);

  return (
    // <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-blue-50 min-h-screen">
    <div className="p-2 md:p-3 space-y-2 md:space-y-3 bg-blue-50 min-h-screen">
      {/* Header */}
      {/* <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-4 md:p-6 text-white"> */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-2 md:p-3 text-white">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-4 min-w-0">
            <Building2 className="h-8 w-8 md:h-10 md:w-10 text-blue-200 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold truncate">
                {building["Budling Name"]}
              </h1>
              <p className="text-blue-100 text-sm md:text-base">
                Building floor details
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floor Details Card */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
        {/* <div className="p-4 md:p-6 border-b border-blue-100 bg-blue-50"> */}
        <div className="p-2 md:p-3 border-b border-blue-100 bg-blue-50">
          <h2 className="text-lg md:text-xl font-semibold text-blue-800">
            Floor Details
          </h2>
          <p className="text-blue-600 text-sm mt-1">
            {floorData.length} floors found
          </p>
        </div>

        {loadingGetFloorData ? (
          <div className="text-center py-8 text-blue-600">
            <Loader2Icon className="inline h-6 w-6 animate-spin mr-2" />
            <span>Loading floor details...</span>
          </div>
        ) : floorData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No floor data available for this building
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              <table className="w-full min-w-[800px] table-fixed">
                <thead className="bg-blue-600 text-white sticky top-0 z-10">
                  <tr>
                    {[
                      "Serial No.",
                      "CB No",
                      "Building Name",
                      "Address",
                      "Floor Name",
                      "Flats",
                      "Count",
                      "Actions",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-xs md:text-sm font-medium uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {floorData.map((floor, index) => {
                    const flatCount = floor["Each Floor Flat No"]
                      ? floor["Each Floor Flat No"]
                          .split(",")
                          .map((f) => f.trim())
                          .filter((f) => f).length
                      : 0;

                    return (
                      <tr
                        key={index}
                        className="hover:bg-blue-50 transition-colors duration-150"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {floor["Serial No."]}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {floor["CB No"]}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-[120px]">
                          {floor["Building Name"]}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-[150px]">
                          {floor["Address"]}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                          {floor["Floor Name"]}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-[200px]">
                          {floor["Each Floor Flat No"]}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                          {flatCount}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => onNavigateToFloor(floor)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md transition-colors duration-150 flex items-center space-x-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="text-xs md:text-sm">
                              View Flats
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildingDetails;
