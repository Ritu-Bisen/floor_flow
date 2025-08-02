import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, X, Save, XCircle } from 'lucide-react';

const WorkCategory = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  const [formData, setFormData] = useState({
    categoryName: '',
    stages: ['']
  });

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlbHC7RwSjI7pF-OYWm5XuuRXt0LWtRbYjR-sccT59UwcqQMKOKfN8d2pMyRjDFmVS/exec";
  const SHEET_ID = "1Z3XPIuTuPU-9UcbhOoMTVv-e469JMxUzPklHgGNukvk";
  const SHEET_NAME = "Category work master";

  // Fetch categories from Google Sheets
  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}&headers=1`);
      const text = await response.text();
      
      const jsonString = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/)?.[1];
      if (!jsonString) {
        setCategories([]);
        setFilteredCategories([]);
        return;
      }
      
      const data = JSON.parse(jsonString);
      
      if (!data.table || !data.table.rows || data.table.rows.length === 0) {
        setCategories([]);
        setFilteredCategories([]);
        return;
      }
      
      // Transform data to match our category structure
      const categoryList = [];
      for (let i = 0; i < data.table.rows.length; i++) {
        const row = data.table.rows[i];
        if (row.c) {
          const category = {
            id: i + 1,
            timestamp: row.c[0]?.v || '', // Column A
            serialNo: row.c[1]?.v || '', // Column B
            categoryNo: row.c[2]?.v || '', // Column C
            categoryName: row.c[3]?.v || '', // Column D
            stage: row.c[4]?.v || '', // Column E
            status: row.c[5]?.v || '', // Column F
          };
          
          categoryList.push(category);
        }
      }
      
      setCategories(categoryList);
      setFilteredCategories(categoryList);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
      setFilteredCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search term and selected category
  useEffect(() => {
    let filtered = categories;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(category => 
        category.categoryName && category.categoryName.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search term (search across all columns)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(category =>
        Object.values(category).some(value =>
          value && value.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    setFilteredCategories(filtered);
  }, [categories, searchTerm, selectedCategory]);

  // Get unique categories from categories data
  const getUniqueCategories = () => {
    const categoryNames = categories
      .map(category => category.categoryName)
      .filter(categoryName => categoryName && categoryName.trim() !== '')
      .filter((categoryName, index, arr) => arr.indexOf(categoryName) === index)
      .sort();
    return categoryNames;
  };

  // Get count of unique categories
  const getUniqueCategoriesCount = () => {
    return getUniqueCategories().length;
  };

  const handleAddCategory = () => {
    setFormData({
      categoryName: '',
      stages: ['']
    });
    setShowAddForm(true);
  };

  const handleAddStage = () => {
    setFormData(prev => ({
      ...prev,
      stages: [...prev.stages, '']
    }));
  };

  const handleRemoveStage = (index) => {
    if (formData.stages.length > 1) {
      setFormData(prev => ({
        ...prev,
        stages: prev.stages.filter((_, i) => i !== index)
      }));
    }
  };

  const handleStageChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      stages: prev.stages.map((stage, i) => 
        i === index ? value : stage
      )
    }));
  };

  const handleCategoryNameChange = (value) => {
    setFormData(prev => ({
      ...prev,
      categoryName: value
    }));
  };

  const generateTimestamp = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getLastSerialNumber = async () => {
    try {
      const response = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}&headers=1`);
      const text = await response.text();
      
      const jsonString = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/)?.[1];
      if (!jsonString) {
        return 0;
      }
      
      const data = JSON.parse(jsonString);
      
      if (!data.table || !data.table.rows || data.table.rows.length === 0) {
        return 0;
      }
      
      const rows = data.table.rows;
      let lastSerialNum = 0;
      
      for (const row of rows) {
        if (row.c && row.c[1] && row.c[1].v) {
          const serialValue = row.c[1].v;
          if (typeof serialValue === 'string' && serialValue.startsWith('SN-')) {
            const match = serialValue.match(/SN-(\d+)/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > lastSerialNum) {
                lastSerialNum = num;
              }
            }
          }
        }
      }
      
      return lastSerialNum;
    } catch (error) {
      console.error('Error fetching last serial number:', error);
      return Math.floor(Date.now() / 1000) % 1000;
    }
  };

  const generateNextSerialNumber = (lastSerialNum) => {
    const nextNum = lastSerialNum + 1;
    return `SN-${String(nextNum).padStart(3, '0')}`;
  };

  const handleSubmit = async () => {
    if (!formData.categoryName) {
      alert('Please enter a category name');
      return;
    }

    const hasValidStage = formData.stages.some(stage => stage.trim());

    if (!hasValidStage) {
      alert('Please fill in at least one stage');
      return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = generateTimestamp();
      const lastSerialNum = await getLastSerialNumber();
      const serialNumber = generateNextSerialNumber(lastSerialNum);

      const submissions = [];
      let categoryNo = 1;

      formData.stages.forEach(stage => {
        if (stage.trim()) {
          submissions.push([
            timestamp,           // Column A
            serialNumber,        // Column B
            categoryNo,          // Column C
            formData.categoryName.trim(),   // Column D
            stage.trim(),        // Column E
            'Active'             // Column F - Default status
          ]);
          categoryNo++;
        }
      });

      for (const rowData of submissions) {
        const formDataToSend = new FormData();
        formDataToSend.append('sheetName', SHEET_NAME);
        formDataToSend.append('action', 'insert');
        formDataToSend.append('rowData', JSON.stringify(rowData));

        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: formDataToSend
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to add category');
        }
      }

      alert(`Successfully added ${submissions.length} stage(s) to the sheet with Serial Number: ${serialNumber}!`);
      setShowAddForm(false);
      setFormData({
        categoryName: '',
        stages: ['']
      });

      // Refresh categories list
      fetchCategories();

    } catch (error) {
      console.error('Error submitting category:', error);
      alert('Error adding category: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setFormData({
      categoryName: '',
      stages: ['']
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilterChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category.id);
    setEditFormData({
      categoryName: category.categoryName,
      stage: category.stage,
      status: category.status
    });
  };

  const handleEditCancel = () => {
    setEditingCategory(null);
    setEditFormData({});
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Find row index by matching Serial No, Category No, and Category
  const findRowIndex = async (category) => {
    try {
      const response = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}&headers=1`);
      const text = await response.text();
      
      const jsonString = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/)?.[1];
      if (!jsonString) {
        return -1;
      }
      
      const data = JSON.parse(jsonString);
      
      if (!data.table || !data.table.rows || data.table.rows.length === 0) {
        return -1;
      }
      
      // Find matching row (adding 2 because: 1 for header row + 1 for 1-based indexing)
      for (let i = 0; i < data.table.rows.length; i++) {
        const row = data.table.rows[i];
        if (row.c) {
          const serialNo = row.c[1]?.v || ''; // Column B
          const categoryNo = row.c[2]?.v || ''; // Column C
          const categoryName = row.c[3]?.v || ''; // Column D
          
          if (serialNo === category.serialNo && 
              categoryNo.toString() === category.categoryNo.toString() && 
              categoryName === category.categoryName) {
            return i + 2; // +2 for header row and 1-based indexing
          }
        }
      }
      
      return -1;
    } catch (error) {
      console.error('Error finding row index:', error);
      return -1;
    }
  };

  const handleEditSave = async (category) => {
    try {
      // Find the row index first
      const rowIndex = await findRowIndex(category);
      
      if (rowIndex === -1) {
        throw new Error('Could not find the category row to update');
      }

      // Create an array with empty strings for columns we don't want to change
      // and actual values for columns we do want to update
      const updateData = [];
      updateData[0] = ''; // Column A - Skip (empty so it won't be updated)
      updateData[1] = ''; // Column B - Skip (empty so it won't be updated) 
      updateData[2] = ''; // Column C - Skip (empty so it won't be updated)
      updateData[3] = editFormData.categoryName === '' ? ' ' : editFormData.categoryName;  // Column D - Update
      updateData[4] = editFormData.stage === '' ? ' ' : editFormData.stage;               // Column E - Update
      updateData[5] = editFormData.status === '' ? ' ' : editFormData.status;             // Column F - Update

      const formDataToSend = new FormData();
      formDataToSend.append('sheetName', SHEET_NAME);
      formDataToSend.append('action', 'update');
      formDataToSend.append('rowIndex', rowIndex.toString());
      formDataToSend.append('rowData', JSON.stringify(updateData));

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: formDataToSend
      });

      const text = await response.text();
      console.log('Raw response:', text);

      // Handle empty response
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', text);
        throw new Error('Invalid response from server: ' + text);
      }
      
      if (!result.success) {
        throw new Error(result.error || result.message || 'Failed to update category');
      }

      alert('Category updated successfully!');
      setEditingCategory(null);
      setEditFormData({});
      fetchCategories();

    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error updating category: ' + error.message);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (window.confirm(`Are you sure you want to mark ${category.categoryName} as inactive?`)) {
      try {
        // Find the row index first
        const rowIndex = await findRowIndex(category);
        
        if (rowIndex === -1) {
          throw new Error('Could not find the category row to update');
        }

        // Create an array with empty strings for columns we don't want to change
        // and only update the status column (Column F - index 5)
        const updateData = [];
        updateData[0] = ''; // Column A - Skip (Timestamp)
        updateData[1] = ''; // Column B - Skip (Serial No)
        updateData[2] = ''; // Column C - Skip (Category No)
        updateData[3] = ''; // Column D - Skip (Category Name)
        updateData[4] = ''; // Column E - Skip (Stage)
        updateData[5] = 'Inactive'; // Column F - Status (only field we want to update)

        const formDataToSend = new FormData();
        formDataToSend.append('sheetName', SHEET_NAME);
        formDataToSend.append('action', 'update');
        formDataToSend.append('rowIndex', rowIndex.toString());
        formDataToSend.append('rowData', JSON.stringify(updateData));

        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: formDataToSend
        });

        const text = await response.text();
        console.log('Raw response:', text);

        // Handle empty response
        if (!text || text.trim() === '') {
          throw new Error('Empty response from server');
        }

        let result;
        try {
          result = JSON.parse(text);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', text);
          throw new Error('Invalid response from server: ' + text);
        }
        
        if (!result.success) {
          throw new Error(result.error || result.message || 'Failed to update category status');
        }

        alert('Category marked as inactive successfully!');
        fetchCategories();

      } catch (error) {
        console.error('Error updating category status:', error);
        alert('Error updating category status: ' + error.message);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    // <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
    <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-600 p-4 rounded-xl shadow-sm border border-blue-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Work Categories</h1>
            <p className="text-sm sm:text-base text-blue-100">Manage work categories and stages</p>
          </div>
        </div>
        <button
          onClick={handleAddCategory}
          className="flex items-center space-x-2 bg-white  px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm sm:text-base shadow-md hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Compact Popup Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-blue-100">
            <div className="p-3 border-b border-blue-100 bg-blue-50 flex items-center justify-between">
              <h2 className="text-base font-semibold text-blue-800">Add New Category</h2>
              <button
                onClick={handleCancel}
                className="text-blue-400 hover:text-blue-600 transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.categoryName}
                  onChange={(e) => handleCategoryNameChange(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter category name"
                />
              </div>

              {/* Stages List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Stages</h3>
                  <button
                    type="button"
                    onClick={handleAddStage}
                    className="flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Stage</span>
                  </button>
                </div>

                {formData.stages.map((stage, index) => (
                  <div key={index} className="border border-blue-100 rounded p-2 space-y-2 bg-blue-50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-blue-800 text-xs">Stage {index + 1}</h4>
                      {formData.stages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStage(index)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Stage Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={stage}
                        onChange={(e) => handleStageChange(index, e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Enter stage name"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Actions */}
              <div className="flex space-x-2 pt-2 border-t border-blue-100">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center space-x-1">
                      <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting...</span>
                    </span>
                  ) : 'Submit'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-white text-gray-700 px-4 py-1.5 rounded hover:bg-gray-100 transition-colors text-sm font-medium border border-gray-300 shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-blue-100 bg-blue-50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-base sm:text-lg font-semibold text-blue-800">All Categories</h2>
            
            {/* Search Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Category Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Category:
                </label>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryFilterChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[150px] bg-white"
                >
                  <option value="">All Categories</option>
                  {getUniqueCategories().map((categoryName) => (
                    <option key={categoryName} value={categoryName}>
                      {categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Search:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search categories..."
                    className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[200px]"
                  />
                  <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {isLoadingCategories && (
            <div className="mt-2 flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-500">Loading categories...</p>
            </div>
          )}
          
          {/* Results Count */}
          {!isLoadingCategories && (
            <p className="text-sm text-gray-500 mt-2">
              Showing <span className="font-medium">{getUniqueCategoriesCount()}</span> of <span className="font-medium">{getUniqueCategoriesCount()}</span> categories
              {(searchTerm || selectedCategory) && ' (filtered)'}
            </p>
          )}
        </div>
        
        {/* Fixed Height Table Container */}
        <div className="overflow-auto scrollbar-hide" style={{ height: '400px' }}>
          <table className="w-full min-w-[768px]">
            <thead className="bg-blue-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Serial No.
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Category No.
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-blue-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {isLoadingCategories ? 'Loading categories...' : 
                     searchTerm ? 'No categories match your search criteria' : 'No categories found'}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {category.serialNo}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {category.categoryNo}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {editingCategory === category.id ? (
                        <input
                          type="text"
                          value={editFormData.categoryName}
                          onChange={(e) => handleEditChange('categoryName', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="font-medium text-gray-900 text-sm truncate">{category.categoryName}</div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {editingCategory === category.id ? (
                        <input
                          type="text"
                          value={editFormData.stage}
                          onChange={(e) => handleEditChange('stage', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        category.stage
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {editingCategory === category.id ? (
                        <select
                          value={editFormData.status}
                          onChange={(e) => handleEditChange('status', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${category.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {category.status || 'Active'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {editingCategory === category.id ? (
                          <>
                            <button 
                              onClick={() => handleEditSave(category)}
                              className="text-green-600 hover:text-green-800 transition-colors duration-150 p-1"
                              title="Save changes"
                            >
                              <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button 
                              onClick={handleEditCancel}
                              className="text-gray-600 hover:text-gray-800 transition-colors duration-150 p-1"
                              title="Cancel edit"
                            >
                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleEditCategory(category)}
                              className="text-blue-600 hover:text-blue-800 transition-colors duration-150 p-1"
                              title="Edit category"
                            >
                              <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="text-red-600 hover:text-red-800 transition-colors duration-150 p-1"
                              title="Mark as inactive"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkCategory;