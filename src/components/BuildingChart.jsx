import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  BarChart3,
  PieChart,
  ChevronDown,
} from 'lucide-react';
import axios from 'axios';

const BuildingChart = ({ building, onBack }) => {
  const [progresData, setProgresData] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [buildingData, setBuildingData] = useState([]);
  const [taskCategoryProgress, setTaskCategoryProgress] = useState([]);
  const [floorProgress, setFloorProgress] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!building) return;

    const fetchProgressData = async () => {
      setLoadingProgress(true);
      try {
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzlbHC7RwSjI7pF-OYWm5XuuRXt0LWtRbYjR-sccT59UwcqQMKOKfN8d2pMyRjDFmVS/exec';
        const serialNo = building['Serial No.'];
        const buildingName = encodeURIComponent(building['Budling Name']);

        const res = await axios.get(
          `${SCRIPT_URL}?action=fetchProges&serialNo=${serialNo}&buildingName=${buildingName}`
        );

        if (res.data.success && Array.isArray(res.data.data)) {
          setProgresData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching progress data:', err);
      } finally {
        setLoadingProgress(false);
      }
    };

    fetchProgressData();
  }, [building]);

  useEffect(() => {
    if (!building) return;

    const fetchBuildingData = async () => {
      try {
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzlbHC7RwSjI7pF-OYWm5XuuRXt0LWtRbYjR-sccT59UwcqQMKOKfN8d2pMyRjDFmVS/exec';
        const serialNo = building['Serial No.'];
        const buildingName = encodeURIComponent(building['Budling Name']);

        const res = await axios.get(
          `${SCRIPT_URL}?action=fetchSpecificBuidlingData&serialNo=${serialNo}&buildingName=${buildingName}`
        );

        if (res.data.success) {
          setBuildingData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching building data:', err);
      }
    };

    fetchBuildingData();
  }, [building]);

  useEffect(() => {
    if (buildingData.length > 0) {
      const taskCategories = [...new Set(buildingData.map(item => item['Task category']))];

      const categoryProgress = taskCategories.map(category => {
        const categoryTasks = buildingData.filter(item => item['Task category'] === category);
        const completedTasks = categoryTasks.filter(
          item => item['Actual date'] && item['Actual date'].toString().trim() !== ''
        );

        const percentage =
          categoryTasks.length > 0
            ? Math.round((completedTasks.length / categoryTasks.length) * 100)
            : 0;

        return {
          category,
          total: categoryTasks.length,
          completed: completedTasks.length,
          percentage,
        };
      });

      setTaskCategoryProgress(categoryProgress);

      if (categoryProgress.length > 0 && !selectedCategory) {
        setSelectedCategory(categoryProgress[0].category);
      }
    }
  }, [buildingData, selectedCategory]);

  useEffect(() => {
    if (buildingData.length > 0) {
      const floors = [...new Set(buildingData.map(item => item['Floor Name']))];

      const floorProgressData = floors.map(floor => {
        const floorTasks = buildingData.filter(item => item['Floor Name'] === floor);
        const completedTasks = floorTasks.filter(
          item => item['Actual date'] && item['Actual date'].toString().trim() !== ''
        );

        const percentage =
          floorTasks.length > 0
            ? Math.round((completedTasks.length / floorTasks.length) * 100)
            : 0;

        return {
          floor,
          total: floorTasks.length,
          completed: completedTasks.length,
          percentage,
        };
      });

      setFloorProgress(floorProgressData);
    }
  }, [buildingData]);

  if (!building) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No building data available</p>
      </div>
    );
  }

  const getProgressStats = () => {
    if (!progresData.length) return { total: 0, completed: 0, pending: 0, percentage: 0 };

    const total = progresData.length;
    const completed = progresData.filter(task => task['Actual date']?.trim() !== '').length;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, percentage };
  };

  const getPaymentStats = () => {
    if (!progresData.length) return { paid: 0, pending: 0 };

    const paid = progresData.filter(
      task => task['Payment Status']?.trim().toLowerCase() === 'yes'
    ).length;
    const pending = progresData.length - paid;

    return { paid, pending };
  };

  const getBillStats = () => {
    if (!progresData.length) return { generated: 0, pending: 0 };

    const generated = progresData.filter(task => task['Bill']?.trim().toLowerCase() === 'yes')
      .length;
    const pending = progresData.length - generated;

    return { generated, pending };
  };

  const getSelectedCategoryData = () => {
    return (
      taskCategoryProgress.find(item => item.category === selectedCategory) || {
        category: '',
        total: 0,
        completed: 0,
        percentage: 0,
      }
    );
  };

  const getBarColor = percentage => {
    if (percentage >= 80) return '#EC4899'; // blue-500
    if (percentage >= 60) return '#F472B6'; // blue-400
    if (percentage >= 40) return '#93C5FD'; // blue-300
    return '#BFDBFE'; // blue-200
  };

  const progressStats = getProgressStats();
  const paymentStats = getPaymentStats();
  const billStats = getBillStats();
  const selectedCategoryData = getSelectedCategoryData();

  const totalFloors = building['Total floor'] || 0;
  const totalRooms =
    building['Each Floor Flat No']
      ?.split(',')
      .reduce((sum, range) => {
        const [start, end] = range.trim().split('to').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          return sum + (end - start + 1);
        }
        return sum;
      }, 0) || 0;

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gradient-to-br from-blue-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-blue-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-blue-800">{building['Budling Name']}</h1>
            <p className="text-sm">Building Analytics & Progress</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span className="text-sm font-medium">Analytics View</span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Floors',
            value: totalFloors,
            icon: <TrendingUp className="h-6 w-6 text-white" />,
            color: 'from-blue-500 to-blue-500',
          },
          {
            label: 'Total Rooms',
            value: totalRooms,
            icon: <CheckCircle className="h-6 w-6 text-white" />,
            color: 'from-blue-500 to-blue-500',
          },
          {
            label: 'Work Status',
            value: building['Work Status'] || 'N/A',
            icon: <Clock className="h-6 w-6 text-white" />,
            color: 'from-blue-400 to-blue-400',
          },
          {
            label: 'Progress',
            value: `${progressStats.percentage}%`,
            icon: <BarChart3 className="h-6 w-6 text-white" />,
            color: 'from-blue-400 to-blue-400',
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-tr ${card.color}`}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

     {/* Analytics Section */}
<div className="bg-white rounded-xl shadow-sm border border-blue-200">
  <div className="p-4 sm:p-6 border-b border-blue-200">
    <h2 className="text-base sm:text-lg font-semibold text-blue-600">
      Building Analytics
    </h2>
  </div>

  <div className="p-6">
    <div className="space-y-6">
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Category Progress - Pie Chart */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow">
          <div className="flex items-center space-x-2 mb-6">
            <PieChart className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-blue-700">
              Work Category Progress
            </h3>
          </div>

          {/* Category Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-blue-700 mb-2">
              Select Task Category
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-white border border-blue-300 rounded-lg px-4 py-3 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 flex items-center justify-between"
              >
                <span className="text-blue-800">
                  {selectedCategory || "Select a category"}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-blue-400 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {taskCategoryProgress.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedCategory(item.category);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                        selectedCategory === item.category
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-900"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{item.category}</span>
                        <span className="text-sm text-gray-500">
                          {item.percentage}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Completion Circle */}
          {selectedCategory && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <svg width="200" height="200" className="transform -rotate-90">
                  <defs>
                    <mask id="circleMask">
                      <rect width="200" height="200" fill="black" />
                      <circle cx="100" cy="100" r="60" fill="white" />
                    </mask>
                  </defs>

                  {/* Red background circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="#F9A8D4"
                    mask="url(#circleMask)"
                  />

                  {/* Green Segment */}
                  {selectedCategoryData.percentage > 0 && (
                    <path
                      d={`M 100 100 L 100 20 A 80 80 0 ${
                        selectedCategoryData.percentage > 50 ? 1 : 0
                      } 1 ${
                        100 +
                        80 *
                          Math.sin(
                            (selectedCategoryData.percentage / 100) * 2 * Math.PI
                          )
                      } ${
                        100 -
                        80 *
                          Math.cos(
                            (selectedCategoryData.percentage / 100) * 2 * Math.PI
                          )
                      } Z`}
                      fill="#3B82F6"
                      mask="url(#circleMask)"
                      className="transition-all duration-1000 ease-out"
                    />
                  )}

                  {/* Inner white circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="60"
                    fill="white"
                    stroke="#E5E7EB"
                    strokeWidth="2"
                  />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-700">
                      {selectedCategoryData.percentage}%
                    </div>
                    <div className="text-sm text-gray-500">Complete</div>
                  </div>
                </div>
              </div>

              {/* Category Details */}
              <div className="text-center space-y-2">
                <h4 className="text-lg font-semibold text-blue-700">
                  {selectedCategoryData.category}
                </h4>
                <div className="flex items-center justify-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Completed: {selectedCategoryData.completed}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Pending:{" "}
                      {selectedCategoryData.total -
                        selectedCategoryData.completed}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Total Tasks: {selectedCategoryData.total}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floor Progress */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-blue-700">Floor Progress</h3>
          </div>

          <div className="space-y-4">
            {floorProgress.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">
                    {item.floor}
                  </span>
                  <span className="text-sm font-bold text-blue-900">
                    {item.percentage}%
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-8">
                    <div
                      className="h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: getBarColor(item.percentage),
                      }}
                    >
                      <span className="text-xs font-medium text-white">
                        {item.completed}/{item.total}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Summary */}
          <div className="mt-6 pt-4 border-t border-blue-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {floorProgress.filter(f => f.percentage >= 80).length}
                </div>
                <div className="text-xs text-gray-500">High</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">
                  {floorProgress.filter(
                    f => f.percentage >= 40 && f.percentage < 80
                  ).length}
                </div>
                <div className="text-xs text-gray-500">Medium</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-500">
                  {floorProgress.filter(f => f.percentage < 40).length}
                </div>
                <div className="text-xs text-gray-500">Low</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-gradient-to-r from-blue-100 to-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Payment Status</p>
              <div className="mt-2">
                <p className="text-lg font-bold text-blue-900">
                  {paymentStats.paid} Paid / {paymentStats.pending} Pending
                </p>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-100 to-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Bill Status</p>
              <div className="mt-2">
                <p className="text-lg font-bold text-blue-900">
                  {billStats.generated} Generated / {billStats.pending} Pending
                </p>
              </div>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-100 to-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">
                Completion Rate
              </p>
              <div className="mt-2">
                <p className="text-2xl font-bold text-purple-900">
                  {progressStats.percentage}%
                </p>
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

    </div>
  );
};

export default BuildingChart;
