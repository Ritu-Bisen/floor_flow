import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  ChevronDown,
  Check,
} from "lucide-react";
import axios from "axios";

const FlatDetails = ({ building, floor, flat, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [flatTaskData, setFlatTaskData] = useState([]);
  const [filteredCategory, setFilteredCategory] = useState("All");
  const [submitLoadingCategory, setSubmitLoadingCategory] = useState(null);
  const [submittedCategories, setSubmittedCategories] = useState([]);
  const [taskLoading, setTaskLoading] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);






  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlbHC7RwSjI7pF-OYWm5XuuRXt0LWtRbYjR-sccT59UwcqQMKOKfN8d2pMyRjDFmVS/exec";

  // Map task categories to vendor work types
  const categoryToWorkTypeMap = {
    "Electrical": "Electrical",
    "Plumbing": "Plumbing",
    "Painting": "Painting",
    "Flooring": "Flooring",
    "Civil Structure Work": "Civil Structure Work",
    "Uncategorized": ""
  };

  


  // Fetch all vendors
  useEffect(() => {
    async function fetchVendors() {
      setLoading(true);
      try {
        const { data } = await axios.get(SCRIPT_URL, {
          params: { action: 'fetchAllVendors' }
        });
        if (data.success) {
          setVendors(data.data);
          console.log("Vendors data:", data.data); // Debug log
        } else {
          throw new Error(data.message || 'API error');
        }
      } catch (err) {
        console.error('Vendor fetch failed:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchVendors();
  }, []);

  // Fetch flat tasks
  useEffect(() => {
    async function fetchFlatTasks() {
      try {
        setLoading(true);

        const serialNo = encodeURIComponent(building["Serial No."]);
        const cbNo = encodeURIComponent(flat["CB-No"]);
        const bfNo = encodeURIComponent(flat["BF No"]);
        const buildingName = encodeURIComponent(building["Budling Name"]);
        const floorName = encodeURIComponent(floor["Floor Name"]);

        const { data } = await axios.get(
          `${SCRIPT_URL}?action=fetchFlatTasks&serialNo=${serialNo}&cbNo=${cbNo}&bfNo=${bfNo}&buildingName=${buildingName}&floorName=${floorName}`
        );

        if (data.success) {
          const grouped = {};
          data.data.forEach((task) => {
            const category = task["Task category"] || "Uncategorized";
            const taskNo = task["Task No"];
            if (!grouped[category]) {
              grouped[category] = {
                id: Object.keys(grouped).length + 1,
                category,
                categoryColor: getCategoryColor(category),
                tasks: [],
                vendorName: task["Vendor Name"] || "",
                payment: task["Payment Status"] || "",
                billing: task["Bill"] || "",
              };
            }
            grouped[category].tasks.push({
              id: task["Task ID"],
              name: task["Action"],
              completed: Boolean(task["Actual date"]),
              assignedTo: task["Vendor Name"] || "Unassigned",
              taskNo,
            });
          });

          setFlatTaskData(Object.values(grouped));
        } else {
          console.error("Error fetching tasks:", data.message);
        }
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFlatTasks();
  }, [building, floor, flat]);

  // 1. First, modify your vendor filtering function
const getFilteredVendorNames = (category) => {
  if (!category || category === "All" || !vendors.length) return [];
  
  const workType = categoryToWorkTypeMap[category] || category;
  console.log(`Filtering vendors for category: ${category}, work type: ${workType}`);

  const filtered = vendors.filter(vendor => {
    if (!vendor || !vendor.Category) return false;
    return vendor.Category.toLowerCase().includes(workType.toLowerCase());
  }).map(v => v["Vendor Name"]);

  console.log("Filtered vendor names:", filtered);
  return filtered;
};


  // Get vendors filtered by category
  const getVendorsForCategory = (categoryName) => {
    const workType = categoryToWorkTypeMap[categoryName] || "";
    if (!workType || !vendors.length) return [];
    
    return vendors
      .filter(vendor => {
        // Check if vendor exists and has Category property
        if (!vendor || !vendor["Category"]) return false;
        
        // Case-insensitive comparison
        return vendor["Category"].toLowerCase().includes(workType.toLowerCase());
      })
      .map(vendor => vendor["Vendor Name"]);
  };

  // Add this useEffect hook to log filtered vendors when category changes
useEffect(() => {
  if (filteredCategory !== "All" && vendors.length) {
    const vendorNames = getFilteredVendorNames(filteredCategory);
    console.log("Current vendors for selected category:", vendorNames);
  }
}, [filteredCategory, vendors]);


  const getCategoryColor = (category) => {
    const map = {
      Electrical: "bg-blue-100 text-blue-800 border-blue-200",
      Plumbing: "bg-blue-100 text-blue-800 border-blue-200",
      Painting: "bg-blue-100 text-blue-800 border-blue-200",
      Flooring: "bg-blue-100 text-blue-800 border-blue-200",
      "Civil Structure Work": "bg-blue-100 text-blue-800 border-blue-200",
      Uncategorized: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return map[category] || "bg-blue-100 text-blue-800 border-blue-200";
  };


const toggleSelectTask = (categoryId, taskId, taskNo) => {
  setSelectedTasks((prevSelected) => {
    const alreadySelected = prevSelected.find((t) => t.id === taskId);
    if (alreadySelected) {
      return prevSelected.filter((t) => t.id !== taskId);
    } else {
      return [...prevSelected, { id: taskId, categoryId, taskNo }];
    }
  });
};



const handleCheckboxChange = (task) => {
  if (task.completed) return;

  setSelectedTaskIds((prev) =>
    prev.includes(task.id)
      ? prev.filter((id) => id !== task.id)
      : [...prev, task.id]
  );
};


  const toggleTask = async (categoryId, taskId, taskNo) => {
    setFlatTaskData((prevData) =>
      prevData.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              tasks: category.tasks.map((task) =>
                task.id === taskId ? { ...task, completed: true } : task
              ),
            }
          : category
      )
    );

    try {
      await axios.post(SCRIPT_URL, null, {
        params: {
          action: "updateActualDate",
          taskNo,
          buildingName: building["Budling Name"],
        },
      });
    } catch (error) {
      console.error("Failed to update actual date:", error);
      setFlatTaskData((prevData) =>
        prevData.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                tasks: category.tasks.map((task) =>
                  task.id === taskId ? { ...task, completed: false } : task
                ),
              }
            : category
        )
      );
    }
  };

// const handleBulkSubmit = async () => {
//   setIsSubmitting(true);

//   // const selectedTasks = flatTaskData.flatMap((cat) =>
//   //   cat.tasks
//   //     .filter((t) => selectedTaskIds.includes(t.id))
//   //     .map((t) => ({ ...t, categoryId: cat.id }))
//   // );

 
 

//   // for (const task of selectedTasks) {
//   //  // await toggleTask(task.categoryId, task.id, task.taskNo);
//   // // console.log(task.categoryId, task.id, task.taskNo)
//   // }

//   setSelectedTaskIds([]); // Clear checkboxes
//   setIsSubmitting(false); // Done submitting
// };

const handleBulkSubmit = async () => {
  setIsSubmitting(true);

  // Get all tasks along with their categoryId
  const allTasks = flatTaskData.flatMap((cat) =>
    cat.tasks.map((t) => ({ ...t, categoryId: cat.id }))
  );

  console.log("All Tasks:", allTasks);

  setSelectedTaskIds([]); // Clear checkboxes (if needed)
  setIsSubmitting(false);
};

const handleSubmitAll = async () => {
  try {
    // Prepare submission payload using selectedTasks structure
    const payload = selectedTasks.map((task) => ({
      id: task.id,
      categoryId: task.categoryId,
      taskNo: task.taskNo,
    }));

    console.log("Submitting all tasks:", payload);

   // Example: Post each task to your backend or Apps Script
    for (const task of payload) {
      await toggleTask(task.categoryId, task.id, task.taskNo);
    }

    // Clear selected tasks after submission
    setSelectedTasks([]);
  } catch (error) {
    console.error("Error submitting all tasks:", error);
  }
};



  const handleSubmit = async (category) => {
    console.log(category);
    
    if (!category.vendorName || !category.payment || !category.billing) return;
    setSubmitLoadingCategory(category.id);
    try {
      await axios.post(SCRIPT_URL, null, {
        params: {
          action: "updateCategoryMeta",
          buildingName: building["Budling Name"],
          category: category.category,
          vendorName: category.vendorName,
          payment: category.payment,
          billing: category.billing,
        },
      });
      setSubmittedCategories((prev) => [...prev, category.id]);
    } catch (err) {
      console.error("Submit failed", err);
    } finally {
      setSubmitLoadingCategory(null);
    }
  };

  const categoriesToDisplay =
    filteredCategory === "All"
      ? flatTaskData
      : flatTaskData.filter((cat) => cat.category === filteredCategory);
  return (
    // <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
    <div className="p-2 md:p-3 space-y-2 md:space-y-3 bg-blue-50 min-h-screen">
      {/* <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-4 md:p-6 text-white sm:p-6 border border-gray-200"> */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-2 md:p-3 text-white sm:p-6 border border-gray-200">
        <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
          <button
            onClick={onBack}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
                {building["Budling Name"]} - {floor["Floor Name"]} - {flat["Each Floor Flat No"]}
              </h1>
              <p className="text-sm sm:text-base text-blue-100">
                Task management for {flat.type} flat
              </p>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-auto relative">
          <select
            value={filteredCategory}
            onChange={(e) => setFilteredCategory(e.target.value)}
            className="appearance-none w-full border border-blue-200 bg-white rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Categories</option>
            {flatTaskData.map((cat) => (
              <option key={cat.id} value={cat.category}>
                {cat.category}
              </option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
   {/* {selectedTaskIds.length > 0 && (
  <div className="flex justify-end mb-4">
  <button
      onClick={handleBulkSubmit}
      disabled={isSubmitting}
      className={`${
        isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
      } text-white px-4 py-2 rounded-md text-sm font-medium`}
    >
      {isSubmitting
        ? "Submitting..."
        : `Submit Selected Tasks (${selectedTaskIds.length})`}
    </button>
  </div>
)} */}
{selectedTasks.length > 0 && (
  <div className="p-4">
    <button
      onClick={handleSubmitAll}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
    >
      Submit All ({selectedTasks.length})
    </button>
  </div>
)}


      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {categoriesToDisplay.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No tasks found for this category</p>
            </div>
          ) : (
           categoriesToDisplay.map((category) => {
              const categoryCompletedTasks = category.tasks.filter(
                (task) => task.completed
              ).length;
              const categoryProgress = Math.round(
                (categoryCompletedTasks / category.tasks.length) * 100
              );

              const isSubmitted = submittedCategories.includes(category.id);
              const categoryVendors = getVendorsForCategory(category.category);

              return (
                <div
                  key={category.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-4 sm:p-6 border-b border-gray-200 bg-blue-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 text-sm font-medium rounded-full border ${category.categoryColor}`}
                        >
                          {category.category}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {categoryCompletedTasks}/{category.tasks.length} tasks completed
                        </span>
                      </div>

                      <div className="flex-1 max-w-md">
                        <div className="flex flex-col sm:flex-row gap-2 flex-wrap items-center">
                      <select
  value={category.vendorName || ""}
  disabled={isSubmitted}
  onChange={(e) => {
    const value = e.target.value;
    setFlatTaskData((prev) =>
      prev.map((cat) =>
        cat.id === category.id ? { ...cat, vendorName: value } : cat
      )
    );
  }}
  className={`border border-blue-200 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
    isSubmitted ? "bg-gray-100" : "bg-white"
  }`}
>
  <option value="">Select Vendor</option>
  {getFilteredVendorNames(category.category).map((name) => (
    <option key={name} value={name}>
      {name}
    </option>
  ))}
</select>

                          <select
                            value={category.payment || ""}
                            disabled={isSubmitted}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFlatTaskData((prev) =>
                                prev.map((cat) =>
                                  cat.id === category.id ? { ...cat, payment: value } : cat
                                )
                              );
                            }}
                            className={`border border-blue-200 rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              isSubmitted ? "bg-gray-100" : "bg-white"
                            }`}
                          >
                            <option value="">Payment Status</option>
                            <option value="Yes">Paid</option>
                            <option value="No">Pending</option>
                          </select>
                          <select
                            value={category.billing || ""}
                            disabled={isSubmitted}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFlatTaskData((prev) =>
                                prev.map((cat) =>
                                  cat.id === category.id ? { ...cat, billing: value } : cat
                                )
                              );
                            }}
                            className={`border border-blue-200 rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              isSubmitted ? "bg-gray-100" : "bg-white"
                            }`}
                          >
                            <option value="">Billing Status</option>
                            <option value="Yes">Billed</option>
                            <option value="No">Pending</option>
                          </select>
                          <button
                            disabled={
                              !category.vendorName ||
                              !category.payment ||
                              !category.billing ||
                              submitLoadingCategory === category.id ||
                              isSubmitted
                            }
                            onClick={() =>{ handleSubmit(category);console.log(category)}}
                            className={`bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors duration-200 w-full sm:w-auto ${
                              submitLoadingCategory === category.id || isSubmitted
                                ? "opacity-70 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {submitLoadingCategory === category.id
                              ? "Submitting..."
                              : isSubmitted
                              ? "✓ Submitted"
                              : "Submit Details"}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 min-w-[120px]">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${categoryProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-blue-600">
                          {categoryProgress}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="space-y-3">
                      {category.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-200 transition-colors duration-150"
                        >
                          <div className="flex items-center space-x-4 min-w-0 flex-1">
                            {/* <button
                              onClick={() => toggleTask(category.id, task.id, task.taskNo)}
                              className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
                                task.completed
                                  ? "bg-green-100 text-green-600"
                                  : "border border-gray-300 hover:border-blue-400"
                              }`}
                              disabled={task.completed || taskLoading === task.id}
                            >
                              {task.completed ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : taskLoading === task.id ? (
                                <div className="h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : null}
                            </button> */} {task.completed ? (
  // ✅ If completed, show disabled check-circle button
  <button
    className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center bg-green-100 text-green-600 cursor-not-allowed"
    disabled
  >
    <CheckCircle className="h-4 w-4" />
  </button>
) : (
  // ✅ Else, show a styled toggle button that acts like a checkbox
  <button
    onClick={() => toggleSelectTask(category.id, task.id, task.taskNo)}
    className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
      selectedTasks.some((t) => t.id === task.id)
        ? "bg-blue-100 text-blue-600 border border-blue-500"
        : "border border-gray-300 hover:border-blue-400"
    }`}
  >
    {selectedTasks.some((t) => t.id === task.id) ? (
      <Check className="h-4 w-4" />
    ) : null}
  </button>
)}

                     <div className="min-w-0 flex-1">
                              <div
                                className={`font-medium text-sm sm:text-base ${
                                  task.completed
                                    ? "line-through text-gray-500"
                                    : "text-gray-900"
                                }`}
                              >
                                {task.name}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                Assigned to: {task.assignedTo}
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {task.completed ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Completed</span>
                                <span className="sm:hidden">Done</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Pending</span>
                                <span className="sm:hidden">Todo</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default FlatDetails;