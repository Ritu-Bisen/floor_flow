"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Eye,
  X,
  PlusIcon,
  Loader2Icon,
  MapPin,
  Hash,
} from "lucide-react";
import axios from "axios";

const Building = ({ onNavigateToBuilding }) => {
  const [openAddBuildingForm, setOpenAddBuildingForm] = useState(false);
  const [formSubbmitLoading, setFormSubbmitLoading] = useState(false);
  const [buildingData, setBuildingData] = useState([]);
  const [loadingGetBuildingData, setLoadingGetBuildingData] = useState(false);

  const [filterSerialNo, setFilterSerialNo] = useState("");
  const [filterBuildingName, setFilterBuildingName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    totalFloors: "",
  });
  const [floorInputs, setFloorInputs] = useState([
    { floorName: "", flats: "" },
  ]);

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzlbHC7RwSjI7pF-OYWm5XuuRXt0LWtRbYjR-sccT59UwcqQMKOKfN8d2pMyRjDFmVS/exec";

  const handleAddFloor = () => {
    if (floorInputs.length < formData.totalFloors) {
      setFloorInputs([...floorInputs, { floorName: "", flats: "" }]);
    }
  };

  const handleChangePair = (index, field, value) => {
    const updated = [...floorInputs];
    updated[index][field] = value;
    setFloorInputs(updated);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    const floorNamesStr = floorInputs.map((item) => item.floorName).join(", ");
    const flatsStr = floorInputs
      .map((item, index) => {
        const floorStart = (index + 1) * 100 + 1;
        const floorEnd = floorStart + Number(item.flats) - 1;
        return `${floorStart} to ${floorEnd}`;
      })
      .join(", ");

    const formDataa = new FormData();
    formDataa.append("action", "insert");
    formDataa.append("buildingName", formData.name);
    formDataa.append("address", formData.address);
    formDataa.append("totalFloors", formData.totalFloors);
    formDataa.append("floorNames", floorNamesStr);
    formDataa.append("floorFlats", flatsStr);

    try {
      setFormSubbmitLoading(true);
      const response = await axios.post(SCRIPT_URL, formDataa);
      if (response.data.success) {
        fetchData();
      }
    } catch (error) {
      console.log(error.message);
    } finally {
      setOpenAddBuildingForm(false);
      setFormSubbmitLoading(false);
    }
  };

  async function fetchData() {
    try {
      setLoadingGetBuildingData(true);
      const res = await axios.get(`${SCRIPT_URL}?action=fetchAllBuildings`);
      if (res.data.success) {
        setBuildingData(res.data.data);
      } else {
        console.error("Unexpected response:", res.data);
      }
    } catch (err) {
      console.error("Failed to fetch buildings", err);
    } finally {
      setLoadingGetBuildingData(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBuildingData = buildingData.filter((building) => {
    const matchesSerialNo =
      filterSerialNo === "" ||
      building["Serial No."]
        .toString()
        .toLowerCase()
        .includes(filterSerialNo.toLowerCase());
    const matchesBuildingName =
      filterBuildingName === "" ||
      building["Budling Name"]
        .toLowerCase()
        .includes(filterBuildingName.toLowerCase());
    return matchesSerialNo && matchesBuildingName;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="p-4 space-y-2 max-w-full mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-2 sm:p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Buildings Management
                </h1>
                <p className="text-blue-600/70 text-sm sm:text-base mt-1">
                  Manage and organize all your building projects
                </p>
              </div>
            </div>
            <button
              className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              onClick={() => setOpenAddBuildingForm(!openAddBuildingForm)}
            >
              <div className="flex items-center space-x-2">
                <PlusIcon className="h-5 w-5" />
                <span>Add Building</span>
              </div>
            </button>
          </div>
        </div>

        {/* Add building form modal */}
        {openAddBuildingForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-blue-100">
              <button
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
                onClick={() => setOpenAddBuildingForm(false)}
              >
                <X className="h-5 w-5" />
              </button>

              <div className="p-6 sm:p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg mb-4">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    Add New Building
                  </h2>
                  <p className="text-blue-600/70 mt-2">
                    Fill in the details to create a new building
                  </p>
                </div>

                <form
                  onSubmit={handleSubmitForm}
                  className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Building Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30"
                        placeholder="Enter building name"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <MapPin className="inline h-4 w-4 mr-1" />
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        rows="3"
                        className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30 resize-none"
                        placeholder="Enter complete address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Hash className="inline h-4 w-4 mr-1" />
                        Total Floors
                      </label>
                      <input
                        type="number"
                        name="totalFloors"
                        value={formData.totalFloors}
                        onChange={handleChange}
                        required
                        min="1"
                        className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-blue-50/30"
                        placeholder="Number of floors"
                      />
                    </div>
                  </div>

                  {/* Floor Details Section */}
                  <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Floor Details
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddFloor}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        disabled={floorInputs.length >= formData.totalFloors}
                      >
                        <PlusIcon className="h-4 w-4" />
                        <span>Add Floor</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {floorInputs.map((item, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Floor {index + 1} Name
                              </label>
                              <input
                                type="text"
                                placeholder={`Floor ${index + 1} Name`}
                                value={item.floorName}
                                onChange={(e) =>
                                  handleChangePair(
                                    index,
                                    "floorName",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Flats Per Floor
                              </label>
                              <input
                                type="number"
                                placeholder="Number of flats"
                                value={item.flats}
                                onChange={(e) =>
                                  handleChangePair(
                                    index,
                                    "flats",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-blue-100">
                    <button
                      type="button"
                      onClick={() => setOpenAddBuildingForm(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
                      disabled={formSubbmitLoading}
                    >
                      {formSubbmitLoading && (
                        <Loader2Icon className="animate-spin h-4 w-4" />
                      )}
                      <span>
                        {formSubbmitLoading ? "Creating..." : "Create Building"}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Buildings Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Building2 className="h-6 w-6" />
                  <span>All Buildings</span>
                </h2>
                <p className="text-blue-100 mt-1">
                  Overview of all registered buildings
                </p>
              </div>

              {/* Filter Section */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter by Serial No."
                    value={filterSerialNo}
                    onChange={(e) => setFilterSerialNo(e.target.value)}
                    className="w-full sm:w-48 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/70 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter by Building Name"
                    value={filterBuildingName}
                    onChange={(e) => setFilterBuildingName(e.target.value)}
                    className="w-full sm:w-48 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/70 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  />
                </div>
                {(filterSerialNo || filterBuildingName) && (
                  <button
                    onClick={() => {
                      setFilterSerialNo("");
                      setFilterBuildingName("");
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 backdrop-blur-sm font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50 border-b border-blue-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider min-w-[100px]">
                    Serial No.
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider min-w-[200px]">
                    Building Name
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider min-w-[300px]">
                    Address
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider min-w-[120px]">
                    Total Floors
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider min-w-[200px]">
                    Floor Names
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider min-w-[250px]">
                    Flat Numbers
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider min-w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>

              {loadingGetBuildingData ? (
                <tbody>
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative">
                          <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                          <div className="absolute inset-0 h-12 w-12 border-4 border-transparent border-t-blue-400 rounded-full animate-spin animation-delay-150"></div>
                        </div>
                        <p className="text-blue-600 font-medium mt-4">
                          Loading building data...
                        </p>
                        <p className="text-blue-400 text-sm mt-1">
                          Please wait while we fetch your buildings
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y divide-blue-100">
                  {filteredBuildingData.map((building, index) => (
                    <tr
                      key={index}
                      className="hover:bg-blue-50/50 transition-colors duration-200 group"
                    >
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-bold">
                          {building["Serial No."]}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                        <div className="break-words">
                          {building["Budling Name"]}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="break-words">
                            {building["Address"]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Hash className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">
                            {building["Total floor"]}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div className="break-words whitespace-pre-wrap">
                          {building["Floor Name"]}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div className="break-words font-mono text-xs bg-gray-100 px-2 py-1 rounded whitespace-pre-wrap">
                          {building["Each Floor Flat No"]}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <button
                          onClick={() => onNavigateToBuilding(building)}
                          className="group/btn inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <Eye className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-200" />
                          <span className="font-medium">View</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredBuildingData.length === 0 &&
                    !loadingGetBuildingData && (
                      <tr>
                        <td colSpan={7}>
                          <div className="flex flex-col items-center justify-center py-16">
                            <div className="p-4 bg-blue-100 rounded-full mb-4">
                              <Building2 className="h-12 w-12 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {buildingData.length === 0
                                ? "No Buildings Found"
                                : "No Matching Buildings"}
                            </h3>
                            <p className="text-gray-600 text-center max-w-md">
                              {buildingData.length === 0
                                ? 'You haven\'t added any buildings yet. Click the "Add Building" button to get started.'
                                : "No buildings match your current filter criteria. Try adjusting your search terms."}
                            </p>
                            {(filterSerialNo || filterBuildingName) && (
                              <button
                                onClick={() => {
                                  setFilterSerialNo("");
                                  setFilterBuildingName("");
                                }}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                              >
                                Clear Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                </tbody>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Building;