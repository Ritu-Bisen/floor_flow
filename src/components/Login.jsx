import React, { useState, useEffect } from 'react';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzlbHC7RwSjI7pF-OYWm5XuuRXt0LWtRbYjR-sccT59UwcqQMKOKfN8d2pMyRjDFmVS/exec';
  const SHEET_ID = '1Z3XPIuTuPU-9UcbhOoMTVv-e469JMxUzPklHgGNukvk';
  const SHEET_NAME = 'Login Master';

  // Check for existing login state on component mount
  useEffect(() => {
    const checkExistingAuth = () => {
      try {
        const savedUsername = localStorage.getItem('floorflow_username');
        const savedPassword = localStorage.getItem('floorflow_password');
        const savedUserInfo = localStorage.getItem('floorflow_userinfo');
        
        if (savedUsername && savedPassword && savedUserInfo) {
          const userInfo = JSON.parse(savedUserInfo);
          // Automatically log in the user with saved credentials
          onLogin(savedUsername, savedPassword, userInfo);
        }
      } catch (error) {
        console.error('Error checking existing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('floorflow_username');
        localStorage.removeItem('floorflow_password');
        localStorage.removeItem('floorflow_userinfo');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, [onLogin]);

  const authenticateUser = async (username, password) => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch data from Google Sheets using the public CSV export
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
      
      const response = await fetch(csvUrl, {
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const csvText = await response.text();
      
      // Parse CSV data
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
      
      // Find matching user (skip header row)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(value => value.replace(/"/g, '').trim());
        
        if (values.length >= 3) {
          const userName = values[0] || '';
          const userId = values[1] || '';
          const userPassword = values[2] || '';
          const role = values[3] || 'user';
          const pageShoe = values[4] || '';
          
          // Check if username matches either User Name or User ID and password matches
          if ((userName === username || userId === username) && userPassword === password) {
            return {
              userName: userName,
              userId: userId,
              role: role,
              pageShoe: pageShoe
            };
          }
        }
      }
      
      return null; // No matching user found
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuthToStorage = (username, password, userInfo) => {
    try {
      localStorage.setItem('floorflow_username', username);
      localStorage.setItem('floorflow_password', password);
      localStorage.setItem('floorflow_userinfo', JSON.stringify(userInfo));
    } catch (error) {
      console.error('Error saving auth to localStorage:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    try {
      const userInfo = await authenticateUser(username, password);
      
      if (userInfo) {
        // Save authentication data to localStorage
        saveAuthToStorage(username, password, userInfo);
        
        // Pass user info to parent component
        onLogin(username, password, userInfo);
        setError('');
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      setError('Login failed. Please check your connection and try again.');
    }
  };

  // Show loading spinner while checking existing authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-6 sm:p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Floor Flow</h2>
          <p className="text-sm sm:text-base text-gray-600">Building Management System</p>
        </div>

        <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username or User ID
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              placeholder="Enter your username or user ID"
              disabled={isLoading}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-10 text-sm sm:text-base"
                placeholder="Enter your password"
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </div>

        <div className="text-center text-xs sm:text-sm text-gray-500">
          <p>Enter your credentials to access the system</p>
        </div>
      </div>
    </div>
  );
};

export default Login;