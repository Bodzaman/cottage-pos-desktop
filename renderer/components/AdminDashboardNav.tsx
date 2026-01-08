

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { Home, ChevronRight, LayoutDashboard, UtensilsCrossed, Settings, Users, ShoppingCart, ChefHat, Utensils, MapPin, BarChart3, ImageIcon, FilePieChart, Clock, Calendar, Info, Truck, BookOpen, Pizza, Cog } from "lucide-react";

export function AdminDashboardNav() {
  const { isAdmin } = useSimpleAuth();

  return (
    <div className="bg-gray-900 p-4 rounded-lg mb-6 border border-gray-800">
      <h2 className="text-xl font-bold text-white mb-4">Admin Dashboard</h2>
      <div className="sidebar-items mt-4 space-y-1">
        <Link to="/pos" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-200 transition-all hover:text-orange-400">
          <ShoppingCart className="h-4 w-4" />
          <span>POS System</span>
        </Link>
        
        <Link to="/kds" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-200 transition-all hover:text-orange-400">
          <ChefHat className="h-4 w-4" />
          <span>Kitchen Display</span>
        </Link>

        <Link to="/media-library" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-200 transition-all hover:text-purple-500">
          <ImageIcon className="h-4 w-4" />
          <span>Media Library</span>
        </Link>
        
        <Link to="/admin/website-management" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-200 transition-all hover:text-purple-500">
          <LayoutDashboard className="h-4 w-4" />
          <span>Website Management</span>
        </Link>
      </div>
      <nav className="space-y-1">
        {/* Every admin can see dashboard overview */}
        <NavLink 
          to="/admin-portal?section=dashboard&subsection=overview" 
          end
          className={({ isActive }) =>
            `block px-4 py-2 rounded-md transition-colors ${isActive 
              ? 'bg-rose-700 text-white' 
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
          }
        >
          Overview
        </NavLink>
        
        {/* Menu management permission */}
        {hasPermission('menu_management') && (
          <NavLink 
            to="/admin/menu" 
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md transition-colors ${isActive 
                ? 'bg-rose-700 text-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
            }
          >
            Menu Management
          </NavLink>
        )}
        
        {/* Order management permission */}
        {hasPermission('order_management') && (
          <NavLink 
            to="/order-management" 
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md transition-colors ${isActive 
                ? 'bg-rose-700 text-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
            }
          >
            Online Orders
          </NavLink>
        )}
        
        {/* Floor Plan permission */}
        {hasPermission('order_management') && (
          <NavLink 
            to="/floor-plan" 
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md transition-colors ${isActive 
                ? 'bg-rose-700 text-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
            }
          >
            <div className="flex items-center">
              <Utensils className="h-4 w-4 mr-2" />
              Floor Plan
            </div>
          </NavLink>
        )}
        
        {/* Delivery Map permission */}
        {hasPermission('order_management') && (
          <NavLink 
            to="/delivery-map" 
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md transition-colors ${isActive 
                ? 'bg-rose-700 text-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
            }
          >
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Delivery Map
            </div>
          </NavLink>
        )}
        
        {/* Admin Dashboard */}
        {isAdmin && (
          <NavLink 
            to="/admin-portal?section=dashboard&subsection=overview" 
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md transition-colors ${isActive 
                ? 'bg-rose-700 text-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
            }
          >
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Admin Dashboard
            </div>
          </NavLink>
        )}
        
        {/* Staff management permission */}
        {hasPermission('staff_management') && (
          <NavLink 
            to="/admin/staff" 
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md transition-colors ${isActive 
                ? 'bg-rose-700 text-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
            }
          >
            Staff Management
          </NavLink>
        )}
        
        {/* Settings permission */}
        {hasPermission('settings') && (
          <NavLink 
            to="/admin-portal?section=settings&subsection=profile" 
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md transition-colors ${isActive 
                ? 'bg-rose-700 text-white' 
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
            }
          >
            <div className="flex items-center">
              <Cog className="h-4 w-4 mr-2" />
              Restaurant Settings
            </div>
          </NavLink>
        )}
        
        {/* Database setup - admin only */}
        {hasPermission('admin') && (
          <>
            <NavLink 
              to="/media-library" 
              className={({ isActive }) =>
                `block px-4 py-2 rounded-md transition-colors ${isActive 
                  ? 'bg-rose-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
              }
            >
              <div className="flex items-center">
                <ImageIcon className="h-4 w-4 mr-2" />
                Media Library
              </div>
            </NavLink>
            <NavLink 
              to="/db-schema-setup" 
              className={({ isActive }) =>
                `block px-4 py-2 rounded-md transition-colors ${isActive 
                  ? 'bg-rose-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
              }
            >
              Auth & System Setup
            </NavLink>

          </>
        )}
      </nav>
    </div>
  );
}
