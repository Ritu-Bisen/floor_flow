import React, { useState } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Building from './components/Building.jsx';
import WorkCategory from './components/WorkCategory.jsx';
import Vendors from './components/Vendors.jsx';
import BuildingDetails from './components/BuildingDetails.jsx';
import FloorDetails from './components/FloorDetails.jsx';
import FlatDetails from './components/FlatDetails.jsx';
import BuildingChart from './components/BuildingChart.jsx';
import Sidebar from './components/Sidebar.jsx';
import Footer from './components/Footer.jsx';
import { Building2, Home, Users, Settings, LogOut } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [allowedPages, setAllowedPages] = useState([]);

  const handleLogin = (username, password, userInfo) => {
    if (userInfo) {
      setIsAuthenticated(true);
      setCurrentUser(userInfo);
      
      // Parse allowed pages from pageShoe field
      const pages = userInfo.pageShoe ? userInfo.pageShoe.split(' or ').map(page => page.trim().toLowerCase()) : [];
      setAllowedPages(pages);
      
      // console.log('Page Show from sheet:', userInfo.pageShoe);
      // console.log('Parsed pages:', pages);
      
      // Set first page from Page Show column as the initial page
      if (pages.length > 0) {
        // Map page names to component IDs
        const pageMapping = {
          'dashboard': 'dashboard',
          'buildings': 'buildings', 
          'building': 'buildings',
          'work category': 'work-category',
          'workcategory': 'work-category',
          'vendors': 'vendors',
          'vendor': 'vendors'
        };
        
        // Get the first page from the Page Show column
        const firstPageFromSheet = pages[0];
        // console.log('First page from sheet:', firstPageFromSheet);
        
        const mappedPage = pageMapping[firstPageFromSheet];
        // console.log('Mapped page:', mappedPage);
        
        if (mappedPage) {
          setCurrentPage(mappedPage);
        } else {
          // If no valid mapping found, use the first allowed page that has a mapping
          const firstAllowedPage = pages.find(page => pageMapping[page]);
          if (firstAllowedPage && pageMapping[firstAllowedPage]) {
            setCurrentPage(pageMapping[firstAllowedPage]);
          } else {
            // Try to find a close match
            const closeMatch = pages.find(page => 
              Object.keys(pageMapping).some(key => 
                key.includes(page) || page.includes(key)
              )
            );
            if (closeMatch) {
              const matchedKey = Object.keys(pageMapping).find(key => 
                key.includes(closeMatch) || closeMatch.includes(key)
              );
              setCurrentPage(pageMapping[matchedKey]);
            } else {
              // No valid page found, show error or first available
              console.error('No valid page mapping found for:', pages);
              setCurrentPage('dashboard'); // Fallback only if absolutely nothing matches
            }
          }
        }
      } else {
        console.error('No pages defined in Page Show column');
        setCurrentPage('dashboard'); // Fallback if no pages defined
      }
      
      return true;
    }
    return false;
  };

  const handleLogout = () => {

    // Clear auth-related localStorage
  localStorage.removeItem('floorflow_username');
  localStorage.removeItem('floorflow_password');
  localStorage.removeItem('floorflow_userinfo');

  
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
    setSelectedBuilding(null);
    setSelectedFloor(null);
    setSelectedFlat(null);
    setCurrentUser(null);
    setAllowedPages([]);
  };

  const navigateToBuilding = (building) => {
    setSelectedBuilding(building);
    setCurrentPage('building-details');
  };

  // New function for navigating to BuildingChart
  const navigateToBuildingChart = (building) => {
    setSelectedBuilding(building);
    setCurrentPage('building-chart');
  };

  const navigateToFloor = (floor) => {
    setSelectedFloor(floor);
    setCurrentPage('floor-details');
  };

  const navigateToFlat = (flat) => {
    setSelectedFlat(flat);
    setCurrentPage('flat-details');
  };

  const navigateBack = () => {
    if (currentPage === 'flat-details') {
      setCurrentPage('floor-details');
      setSelectedFlat(null);
    } else if (currentPage === 'floor-details') {
      setCurrentPage('building-details');
      setSelectedFloor(null);
    } else if (currentPage === 'building-details') {
      setCurrentPage('buildings');
      setSelectedBuilding(null);
    } else if (currentPage === 'building-chart') {
      setCurrentPage('dashboard');
      setSelectedBuilding(null);
    }
  };

  // Function to check if user has access to a page
  const hasPageAccess = (pageId) => {
    if (!currentUser || allowedPages.length === 0) {
      return true; // If no restrictions defined, allow all pages
    }

    const pageMapping = {
      'dashboard': ['dashboard'],
      'buildings': ['buildings', 'building'],
      'work-category': ['work category', 'workcategory'],
      'vendors': ['vendors', 'vendor']
    };

    const allowedForPage = pageMapping[pageId] || [];
    return allowedForPage.some(pageName => 
      allowedPages.some(allowedPage => 
        allowedPage.toLowerCase().includes(pageName.toLowerCase()) || 
        pageName.toLowerCase().includes(allowedPage.toLowerCase())
      )
    );
  };

  // Filter menu items based on user permissions
  const getAllowedMenuItems = () => {
    const allMenuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'buildings', label: 'Buildings', icon: Building2 },
      { id: 'work-category', label: 'Work Category', icon: Settings },
      { id: 'vendors', label: 'Vendors', icon: Users },
    ];
    

    return allMenuItems.filter(item => hasPageAccess(item.id));
  };

  const handleNavigate = (pageId) => {
    if (hasPageAccess(pageId)) {
      setCurrentPage(pageId);
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    // Check if user has access to current page
    if (!hasPageAccess(currentPage) && 
        !['building-details', 'floor-details', 'flat-details', 'building-chart'].includes(currentPage)) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500 mt-2">Contact your administrator for access.</p>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigateToBuilding={navigateToBuilding} onNavigateToBuildingChart={navigateToBuildingChart} />;
      case 'buildings':
        return <Building onNavigateToBuilding={navigateToBuilding} />;
      case 'building-details':
        return (
          <BuildingDetails
            building={selectedBuilding}
            onNavigateToFloor={navigateToFloor}
            onBack={navigateBack}
          />
        );
      case 'building-chart':
        return (
          <BuildingChart
            building={selectedBuilding}
            onBack={navigateBack}
          />
        );
      case 'floor-details':
        return (
          <FloorDetails
            building={selectedBuilding}
            floor={selectedFloor}
            onNavigateToFlat={navigateToFlat}
            onBack={navigateBack}
          />
        );
      case 'flat-details':
        return (
          <FlatDetails
            building={selectedBuilding}
            floor={selectedFloor}
            flat={selectedFlat}
            onBack={navigateBack}
          />
        );
      case 'work-category':
        return <WorkCategory />;
      case 'vendors':
        return <Vendors />;
      default:
        return <Dashboard onNavigateToBuilding={navigateToBuilding} onNavigateToBuildingChart={navigateToBuildingChart} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          menuItems={getAllowedMenuItems()}
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          currentUser={currentUser}
        />
        <main className="flex-1 overflow-auto lg:ml-0">
          <div className="lg:hidden h-16"></div> {/* Spacer for mobile menu button */}
          
          {/* User Info Header */}
          {currentUser && (
            <div className="bg-white shadow-sm border-b px-4 py-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-600">Welcome, </span>
                  <span className="text-sm font-medium text-gray-900">
                    {currentUser.userName || currentUser.userId}
                  </span>
                  {currentUser.role && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {currentUser.role}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
          
          {renderContent()}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;