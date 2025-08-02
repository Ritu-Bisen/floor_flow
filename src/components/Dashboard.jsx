import React, { useEffect, useState } from "react";
import {
  Building2,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
  Eye,
  HardHat,
  DollarSign,
  FileText,
  CalendarCheck
} from "lucide-react";
import axios from "axios";

const Dashboard = ({ onNavigateToBuilding, onNavigateToBuildingChart }) => {
  const [buildingData, setBuildingData] = useState([]);
  const [vendorData, setVendorData] = useState([]);
  const [workCategoryData, setWorkCategoryData] = useState([]);
  const [uniqueCategoryDatas, setUniqueCategoryDatas] = useState([]);
  const [progresData, setProgresData] = useState([]);

  const [loadingGetBuildingData, setLoadingGetBuildingData] = useState(false);
  const [loadingGetVendorData, setLoadingGetVendorData] = useState(false);
  const [loadingGetWorkCategoryData, setLoadingGetWorkCategoryData] = useState(false);
  const [loadingGetProgresData, setLoadingGetProgresData] = useState(false);



  // For Progress
  useEffect(() => {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlbHC7RwSjI7pF-OYWm5XuuRXt0LWtRbYjR-sccT59UwcqQMKOKfN8d2pMyRjDFmVS/exec";

    async function fetchProgressForAllBuildings() {
      try {
        setLoadingGetProgresData(true);
        const allProgressData = [];

        for (const building of buildingData) {
          const serialNo = building["Serial No."];
          const buildingName = encodeURIComponent(building["Budling Name"]);
          const res = await axios.get(
            `${SCRIPT_URL}?action=fetchProges&serialNo=${serialNo}&buildingName=${buildingName}`
          );

          if (res.data.success && Array.isArray(res.data.data)) {
            allProgressData.push({
              serialNo,
              buildingName,
              data: res.data.data,
            });
          } else {
            console.warn("No progress data for", buildingName, serialNo);
          }
        }

        setProgresData(allProgressData);
      } catch (err) {
        console.error("Error fetching progress data for all buildings:", err);
      } finally {
        setLoadingGetProgresData(false);
      }
    }

    if (buildingData.length > 0) {
      fetchProgressForAllBuildings();
    }
  }, [buildingData]);


   // Single useEffect for all initial data fetching
  useEffect(() => {
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlbHC7RwSjI7pF-OYWm5XuuRXt0LWtRbYjR-sccT59UwcqQMKOKfN8d2pMyRjDFmVS/exec";
    
    async function fetchAllData() {
      try {
        setLoadingGetBuildingData(true);
        setLoadingGetVendorData(true);
        setLoadingGetWorkCategoryData(true);
        // setError(null);
        
        // Fetch all data in parallel
        const [buildingsRes, vendorsRes, categoriesRes] = await Promise.all([
          axios.get(`${SCRIPT_URL}?action=fetchAllBuildings`),
          axios.get(`${SCRIPT_URL}?action=fetchAllVendors`),
          axios.get(`${SCRIPT_URL}?action=fetchAllWorkCategory`)
        ]);

        // Process responses

        console.log("buildingsRes",buildingsRes.data.data);
        // console.log("vendorsRes",vendorsRes.data.data);
        // console.log("categoriesRes",categoriesRes.data.data);
        if (buildingsRes.data.success) setBuildingData(buildingsRes.data.data);
        if (vendorsRes.data.success) setVendorData(vendorsRes.data.data);
        if (categoriesRes.data.success) {
          setWorkCategoryData(categoriesRes.data.data);
          // Extract unique categories
          const uniqueCategories = [
            ...new Set(categoriesRes.data.data.map(item => item["Category Name"]))
          ];
          setUniqueCategoryDatas(uniqueCategories);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoadingGetBuildingData(false);
        setLoadingGetVendorData(false);
        setLoadingGetWorkCategoryData(false);
      }
    }

    fetchAllData();
  }, []);

  useEffect(() => {
    const uniqueCategoryNames = [
      ...new Set(workCategoryData.map((item) => item["Category Name"])),
    ];
    setUniqueCategoryDatas(uniqueCategoryNames);
  }, [workCategoryData]);

  const getProgressPercentage = (buildingName, serialNo) => {
    const progressEntry = progresData.find(
      (entry) =>
        decodeURIComponent(entry.buildingName).toLowerCase() ===
          buildingName.toLowerCase() && entry.serialNo === serialNo
    );

    if (!progressEntry) return 0;

    const totalTasks = progressEntry.data.length;
    const completedTasks = progressEntry.data.filter(
      (task) => task["Actual date"] && task["Actual date"].trim() !== ""
    ).length;

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const getPaymentStatus = (buildingName, serialNo) => {
    const progressEntry = progresData.find(
      (entry) =>
        decodeURIComponent(entry.buildingName).toLowerCase() ===
          buildingName.toLowerCase() && entry.serialNo === serialNo
    );

    if (!progressEntry) return "Pending";

    const anyPending = progressEntry.data.some(
      (task) =>
        !task["Payment Status"] ||
        task["Payment Status"].trim().toLowerCase() === "no"
    );

    return anyPending ? "Pending" : "Complete";
  };

  const getBillStatus = (buildingName, serialNo) => {
    const progressEntry = progresData.find(
      (entry) =>
        decodeURIComponent(entry.buildingName).toLowerCase() ===
          buildingName.toLowerCase() && entry.serialNo === serialNo
    );

    if (!progressEntry) return "Pending";

    const anyPending = progressEntry.data.some(
      (task) => !task["Bill"] || task["Bill"].trim().toLowerCase() === "no"
    );

    return anyPending ? "Pending" : "Complete";
  };

  // Blue color palette
  const bluePalette = {
    primary: "bg-blue-600",
    primaryLight: "bg-blue-500",
    primaryDark: "bg-blue-700",
    primaryText: "text-blue-600",
    primaryBorder: "border-blue-200",
    primaryBgLight: "bg-blue-50",
    cardGradient: "bg-gradient-to-br from-blue-50 to-blue-100"
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
      case "Completed":
      case "Complete":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      case "Pending":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const StatCard = ({ title, value, icon: Icon, loading }) => (
    <div className={`${bluePalette.cardGradient} p-4 rounded-xl shadow-sm border ${bluePalette.primaryBorder} transition-all hover:shadow-md hover:translate-y-[-2px]`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-blue-800 truncate">
            {title}
          </p>
          {loading ? (
            <div className="mt-1 flex items-center space-x-2">
              <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-blue-500">Loading...</span>
            </div>
          ) : (
            <p className="text-lg sm:text-2xl font-bold text-blue-900 mt-1">
              {value}
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${bluePalette.primary} flex-shrink-0 shadow-inner`}>
          <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ percentage }) => (
    <div className="w-full bg-blue-100 rounded-full h-2.5">
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-900">
            Construction Dashboard
          </h1>
          <p className="text-sm text-blue-600">Overview of all construction projects</p>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-blue-500 bg-blue-100 px-3 py-1.5 rounded-full">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Building"
          value={buildingData?.length}
          icon={Building2}
          loading={loadingGetBuildingData}
        />
        <StatCard
          title="Completed"
          value={buildingData.filter(item => item["Work Status"] === "Complete").length}
          icon={CheckCircle}
          loading={loadingGetBuildingData}
        />
        <StatCard
          title="Work Category"
          value={uniqueCategoryDatas?.length}
          icon={HardHat}
          loading={loadingGetWorkCategoryData}
        />
        <StatCard
          title="Active Vendor"
          value={vendorData.filter(item => item.Status === "Active").length}
          icon={Users}
          loading={loadingGetVendorData}
        />
      </div>

      {/* Buildings Overview */}
      <div className={`bg-white rounded-xl shadow-sm border ${bluePalette.primaryBorder} overflow-hidden`}>
        <div className={`p-4 sm:p-6 border-b ${bluePalette.primaryBorder} ${bluePalette.primaryBgLight}`}>
          <h2 className="text-lg sm:text-xl font-semibold text-blue-900 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Buildings Overview
          </h2>
          <p className="text-sm text-blue-600 mt-1">Detailed progress of all construction projects</p>
        </div>

        {loadingGetBuildingData ? (
          <div className="flex justify-center items-center h-40">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-blue-600 mt-3">Loading building data...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full min-w-[640px]">
                <thead className={`${bluePalette.primaryBgLight} sticky top-0`}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Floors/Rooms
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Bill Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {buildingData.length > 0 ? (
                    buildingData.map((building, index) => {
                      const totalFloors = building["Total floor"] || 0;
                      const totalRooms = building["Each Floor Flat No"]?.split(",").reduce((sum, range) => {
                        const [start, end] = range.trim().split("to").map(Number);
                        if (!isNaN(start) && !isNaN(end)) {
                          return sum + (end - start + 1);
                        }
                        return sum;
                      }, 0) || 0;
                      const progressPercent = getProgressPercentage(building["Budling Name"], building["Serial No."]);
                      const paymentStatus = getPaymentStatus(building["Budling Name"], building["Serial No."]);
                      const billingStatus = getBillStatus(building["Budling Name"], building["Serial No."]);

                      return (
                        <tr
                          key={index}
                          className="hover:bg-blue-50 transition-colors duration-150"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-blue-900">
                              {building["Budling Name"]}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-900">
                            {totalFloors} floors / {totalRooms} rooms
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <ProgressBar percentage={progressPercent} />
                              <span className="text-sm font-medium text-blue-900 w-12">
                                {progressPercent}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1 text-blue-500" />
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(paymentStatus)}`}>
                                {paymentStatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-1 text-blue-500" />
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(billingStatus)}`}>
                                {billingStatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => onNavigateToBuildingChart(building)}
                              className="text-blue-600 hover:text-blue-800 transition-colors duration-150 p-1 rounded-full hover:bg-blue-100"
                              title="View Building Analytics"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center text-blue-500 py-6">
                        No building data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;