import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Save, XCircle } from 'lucide-react';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  const [formData, setFormData] = useState({
    category: '',
    vendors: [{
      vendorName: '',
      contactNumber: '',
      emailId: '',
      address: ''
    }]
  });

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlbHC7RwSjI7pF-OYWm5XuuRXt0LWtRbYjR-sccT59UwcqQMKOKfN8d2pMyRjDFmVS/exec";
  const SHEET_ID = "1Z3XPIuTuPU-9UcbhOoMTVv-e469JMxUzPklHgGNukvk";
  const SHEET_NAME = "Vendor Master";

  // Fetch vendors from Google Sheets
  const fetchVendors = async () => {
    try {
      setIsLoadingVendors(true);
      const response = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}&headers=1`);
      const text = await response.text();
      
      const jsonString = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/)?.[1];
      if (!jsonString) {
        setVendors([]);
        setFilteredVendors([]);
        return;
      }
      
      const data = JSON.parse(jsonString);
      
      if (!data.table || !data.table.rows || data.table.rows.length === 0) {
        setVendors([]);
        setFilteredVendors([]);
        return;
      }
      
      // Transform data to match our vendor structure
      const vendorList = [];
      for (let i = 0; i < data.table.rows.length; i++) {
        const row = data.table.rows[i];
        if (row.c) {
          const vendor = {
            id: i + 1,
            timestamp: row.c[0]?.v || '', // Column A
            serialNo: row.c[1]?.v || '', // Column B
            categoryNo: row.c[2]?.v || '', // Column C
            category: row.c[3]?.v || '', // Column D
            vendorName: row.c[4]?.v || '', // Column E
            contactNumber: row.c[5]?.v || '', // Column F
            emailId: row.c[6]?.v || '', // Column G
            address: row.c[7]?.v || '', // Column H
            status: row.c[8]?.v || '', // Column I
          };
          
          vendorList.push(vendor);
        }
      }
      
      setVendors(vendorList);
      setFilteredVendors(vendorList);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
      setFilteredVendors([]);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  // Load vendors on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  // Filter vendors based on search term and selected category
  useEffect(() => {
    let filtered = vendors;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(vendor => 
        vendor.category && vendor.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search term (search across all columns)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(vendor =>
        Object.values(vendor).some(value =>
          value && value.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    setFilteredVendors(filtered);
  }, [vendors, searchTerm, selectedCategory]);

  // Get unique categories from vendors data
  const getUniqueCategories = () => {
    const categories = vendors
      .map(vendor => vendor.category)
      .filter(category => category && category.trim() !== '')
      .filter((category, index, arr) => arr.indexOf(category) === index)
      .sort();
    return categories;
  };

  const handleAddVendor = () => {
    setFormData({
      category: '',
      vendors: [{
        vendorName: '',
        contactNumber: '',
        emailId: '',
        address: ''
      }]
    });
    setShowAddForm(true);
  };

  const handleAddMoreVendor = () => {
    setFormData(prev => ({
      ...prev,
      vendors: [...prev.vendors, {
        vendorName: '',
        contactNumber: '',
        emailId: '',
        address: ''
      }]
    }));
  };

  const handleRemoveVendor = (index) => {
    if (formData.vendors.length > 1) {
      setFormData(prev => ({
        ...prev,
        vendors: prev.vendors.filter((_, i) => i !== index)
      }));
    }
  };

  const handleVendorChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      vendors: prev.vendors.map((vendor, i) => 
        i === index ? { ...vendor, [field]: value } : vendor
      )
    }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({
      ...prev,
      category: value
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
    if (!formData.category) {
      alert('Please enter a category');
      return;
    }

    const hasValidVendor = formData.vendors.some(vendor => 
      vendor.vendorName.trim() && 
      vendor.contactNumber.trim() && 
      vendor.emailId.trim()
    );

    if (!hasValidVendor) {
      alert('Please fill in at least one vendor with name, contact number, and email');
      return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = generateTimestamp();
      const lastSerialNum = await getLastSerialNumber();
      const serialNumber = generateNextSerialNumber(lastSerialNum);

      const submissions = [];
      let categoryNo = 1;

      formData.vendors.forEach(vendor => {
        if (vendor.vendorName.trim() && vendor.contactNumber.trim() && vendor.emailId.trim()) {
          submissions.push([
            timestamp,           // Column A
            serialNumber,        // Column B
            categoryNo,          // Column C
            formData.category,   // Column D
            vendor.vendorName.trim(),     // Column E
            vendor.contactNumber.trim(),  // Column F
            vendor.emailId.trim(),        // Column G
            vendor.address.trim(),        // Column H
            'Active'             // Column I - Default status
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
          throw new Error(result.error || 'Failed to add vendor');
        }
      }

      alert(`Successfully added ${submissions.length} vendor(s) to the sheet with Serial Number: ${serialNumber}!`);
      setShowAddForm(false);
      setFormData({
        category: '',
        vendors: [{
          vendorName: '',
          contactNumber: '',
          emailId: '',
          address: ''
        }]
      });

      // Refresh vendors list
      fetchVendors();

    } catch (error) {
      console.error('Error submitting vendors:', error);
      alert('Error adding vendors: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setFormData({
      category: '',
      vendors: [{
        vendorName: '',
        contactNumber: '',
        emailId: '',
        address: ''
      }]
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilterChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor.id);
    setEditFormData({
      vendorName: vendor.vendorName,
      contactNumber: vendor.contactNumber,
      emailId: vendor.emailId,
      address: vendor.address,
      status: vendor.status
    });
  };

  const handleEditCancel = () => {
    setEditingVendor(null);
    setEditFormData({});
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Find row index by matching Serial No, Category No, and Category
  const findRowIndex = async (vendor) => {
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
          const category = row.c[3]?.v || ''; // Column D
          
          if (serialNo === vendor.serialNo && 
              categoryNo.toString() === vendor.categoryNo.toString() && 
              category === vendor.category) {
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

  const handleEditSave = async (vendor) => {
    try {
      // Find the row index first
      const rowIndex = await findRowIndex(vendor);
      
      if (rowIndex === -1) {
        throw new Error('Could not find the vendor row to update');
      }

      // Create an array with empty strings for columns we don't want to change
      // and actual values for columns we do want to update
      const updateData = [];
      updateData[0] = ''; // Column A - Skip (empty so it won't be updated)
      updateData[1] = ''; // Column B - Skip (empty so it won't be updated) 
      updateData[2] = ''; // Column C - Skip (empty so it won't be updated)
      updateData[3] = ''; // Column D - Skip (empty so it won't be updated)
      updateData[4] = editFormData.vendorName === '' ? ' ' : editFormData.vendorName;       // Column E - Update
      updateData[5] = editFormData.contactNumber === '' ? ' ' : editFormData.contactNumber; // Column F - Update
      updateData[6] = editFormData.emailId === '' ? ' ' : editFormData.emailId;             // Column G - Update
      updateData[7] = editFormData.address === '' ? ' ' : editFormData.address;             // Column H - Update
      updateData[8] = editFormData.status === '' ? ' ' : editFormData.status;               // Column I - Update

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
        throw new Error(result.error || result.message || 'Failed to update vendor');
      }

      alert('Vendor updated successfully!');
      setEditingVendor(null);
      setEditFormData({});
      fetchVendors();

    } catch (error) {
      console.error('Error updating vendor:', error);
      alert('Error updating vendor: ' + error.message);
    }
  };

  const handleDeleteVendor = async (vendor) => {
  if (window.confirm(`Are you sure you want to mark ${vendor.vendorName} as inactive?`)) {
    try {
      // Find the row index first
      const rowIndex = await findRowIndex(vendor);
      
      if (rowIndex === -1) {
        throw new Error('Could not find the vendor row to update');
      }

      // Create an array with empty strings for columns we don't want to change
      // and only update the status column (Column I - index 8)
      const updateData = [];
      updateData[0] = ''; // Column A - Skip (Timestamp)
      updateData[1] = ''; // Column B - Skip (Serial No)
      updateData[2] = ''; // Column C - Skip (Category No)
      updateData[3] = ''; // Column D - Skip (Category)
      updateData[4] = ''; // Column E - Skip (Vendor Name)
      updateData[5] = ''; // Column F - Skip (Contact Number)
      updateData[6] = ''; // Column G - Skip (Email Id)
      updateData[7] = ''; // Column H - Skip (Address)
      updateData[8] = 'Inactive'; // Column I - Status (only field we want to update)

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
        throw new Error(result.error || result.message || 'Failed to update vendor status');
      }

      alert('Vendor marked as inactive successfully!');
      fetchVendors();

    } catch (error) {
      console.error('Error updating vendor status:', error);
      alert('Error updating vendor status: ' + error.message);
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-600 p-4 rounded-xl shadow-sm border border-blue-100">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Vendors</h1>
            <p className="text-sm sm:text-base text-blue-100">Manage vendor information and contracts</p>
          </div>
        </div>
        <button
          onClick={handleAddVendor}
          className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm sm:text-base shadow-md hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Popup Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto border border-blue-200">
            <div className="p-4 sm:p-6 border-b border-blue-100 bg-blue-50 rounded-t-xl flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-blue-800">Add New Vendors</h2>
              <button
                onClick={handleCancel}
                className="text-blue-400 hover:text-blue-600 transition-colors p-1"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter category"
                />
              </div>

              {/* Vendors List */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Vendor Details</h3>
                  <button
                    type="button"
                    onClick={handleAddMoreVendor}
                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add More Vendor</span>
                  </button>
                </div>

                {formData.vendors.map((vendor, index) => (
                  <div key={index} className="border border-blue-100 rounded-lg p-3 sm:p-4 space-y-4 bg-blue-50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-blue-800 text-sm sm:text-base">Vendor {index + 1}</h4>
                      {formData.vendors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVendor(index)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vendor Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={vendor.vendorName}
                          onChange={(e) => handleVendorChange(index, 'vendorName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Enter vendor name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={vendor.contactNumber}
                          onChange={(e) => handleVendorChange(index, 'contactNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Enter contact number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Id <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={vendor.emailId}
                          onChange={(e) => handleVendorChange(index, 'emailId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Enter email address"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={vendor.address}
                          onChange={(e) => handleVendorChange(index, 'address', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Enter address"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-blue-100">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : 'Submit'}
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full sm:w-auto bg-white text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm font-medium border border-gray-300 shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-blue-100 bg-blue-50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-base sm:text-lg font-semibold text-blue-800">All Vendors</h2>
            
            {/* Filter and Search Controls */}
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
                  {getUniqueCategories().map((category) => (
                    <option key={category} value={category}>
                      {category}
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
                    placeholder="Search vendors..."
                    className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-[200px]"
                  />
                  <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {isLoadingVendors && (
            <div className="mt-2 flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-gray-500">Loading vendors...</p>
            </div>
          )}
          
          {/* Results Count */}
          {!isLoadingVendors && (
            <p className="text-sm text-gray-500 mt-2">
              Showing <span className="font-medium">{filteredVendors.length}</span> of <span className="font-medium">{vendors.length}</span> vendors
              {(searchTerm || selectedCategory) && ' (filtered)'}
            </p>
          )}
        </div>
        
        {/* Fixed Height Table Container */}
        <div className="overflow-auto" style={{ height: '400px' }}>
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
                  Vendor Name
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Contact Number
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Email Id
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Address
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
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    {isLoadingVendors ? 'Loading vendors...' : 
                     (searchTerm || selectedCategory) ? 'No vendors match your search criteria' : 'No vendors found'}
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {vendor.serialNo}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {vendor.categoryNo}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {vendor.category}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {editingVendor === vendor.id ? (
                        <input
                          type="text"
                          value={editFormData.vendorName}
                          onChange={(e) => handleEditChange('vendorName', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="font-medium text-gray-900 text-sm truncate">{vendor.vendorName}</div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {editingVendor === vendor.id ? (
                        <input
                          type="tel"
                          value={editFormData.contactNumber}
                          onChange={(e) => handleEditChange('contactNumber', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        vendor.contactNumber
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {editingVendor === vendor.id ? (
                        <input
                          type="email"
                          value={editFormData.emailId}
                          onChange={(e) => handleEditChange('emailId', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        vendor.emailId
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {editingVendor === vendor.id ? (
                        <input
                          type="text"
                          value={editFormData.address}
                          onChange={(e) => handleEditChange('address', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="max-w-xs truncate" title={vendor.address}>
                          {vendor.address}
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {editingVendor === vendor.id ? (
                        <select
                          value={editFormData.status}
                          onChange={(e) => handleEditChange('status', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {vendor.status || 'Active'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {editingVendor === vendor.id ? (
                          <>
                            <button 
                              onClick={() => handleEditSave(vendor)}
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
                              onClick={() => handleEditVendor(vendor)}
                              className="text-blue-600 hover:text-blue-800 transition-colors duration-150 p-1"
                              title="Edit vendor"
                            >
                              <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteVendor(vendor)}
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

export default Vendors;