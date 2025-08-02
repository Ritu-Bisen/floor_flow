import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Eye, Loader2Icon, LogOut } from 'lucide-react';
import axios from 'axios';

const FloorDetails = ({ building, floor, onNavigateToFlat, onBack }) => {
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(false);

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlbHC7RwSjI7pF-OYWm5XuuRXt0LWtRbYjR-sccT59UwcqQMKOKfN8d2pMyRjDFmVS/exec";

  useEffect(() => {
    async function fetchFlats() {
      try {
        setLoading(true);
        const serial = encodeURIComponent(building["Serial No."]);
        const cbNo = encodeURIComponent(floor["CB No"]);
        const name = encodeURIComponent(building["Budling Name"]);
        const floorName = encodeURIComponent(floor["Floor Name"]);

        const { data } = await axios.get(
          `${SCRIPT_URL}?action=fetchFlatsByFloor&serialNo=${serial}&cbNo=${cbNo}&buildingName=${name}&floorName=${floorName}`
        );

        if (data.success) {
          setFlats(data.data);
        } else {
          console.error("Backend error:", data.message);
        }
      } catch (error) {
        console.error("Fetch failed", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFlats();
  }, [building, floor]);

  return (
    // <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-blue-50 min-h-screen">
    <div className="p-2 md:p-3 space-y-2 md:space-y-3 bg-blue-50 min-h-screen">
      {/* Header Section */}
      {/* <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-4 md:p-6 text-white"> */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-2 md:p-3 text-white">
        <div className="flex items-center justify-between">
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
                  {building["Budling Name"]} - {floor["Floor Name"]}
                </h1>
                <p className="text-blue-100 text-sm md:text-base">
                  Floor flats listing
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flats Table Card */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
        {/* <div className="p-4 md:p-6 border-b border-blue-100 bg-blue-50"> */}
        <div className="p-2 md:p-3 border-b border-blue-100 bg-blue-50">
          <h2 className="text-lg md:text-xl font-semibold text-blue-800">
            Flat Details
          </h2>
          <p className="text-blue-600 text-sm mt-1">
            {flats.length} {flats.length === 1 ? 'flat' : 'flats'} found
          </p>
        </div>

        <div className="overflow-auto max-h-[calc(100vh-250px)] scrollbar-hide">
          <table className="w-full">
            <thead className="bg-blue-600 text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">SERIAL NO</th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">CB NO</th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">BF NO</th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">BUILDING</th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">ADDRESS</th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">FLOOR</th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">FLAT NO</th>
                <th className="px-4 py-3 text-left text-sm font-medium uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {flats.map((flat, idx) => (
                <tr key={idx} className="hover:bg-blue-50 transition-colors duration-150">
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium whitespace-nowrap">{flat["Serial No"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{flat["CB-No"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{flat["BF No"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{flat["Building Name"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{flat["Address"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{flat["Floor Name"]}</td>
                  <td className="px-4 py-3 text-sm text-blue-600 font-medium whitespace-nowrap">{flat["Each Floor Flat No"]}</td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <button
                      onClick={() => onNavigateToFlat(flat)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md transition-colors duration-150 flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
              {flats.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No flat data found for this floor
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="flex justify-center items-center p-4">
            <Loader2Icon className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-600">Loading flats...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloorDetails;