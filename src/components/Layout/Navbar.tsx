import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Coins } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationCenter } from '../Notifications/NotificationCenter';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Match', href: '/match' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Rewards', href: '/rewards' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LL</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                LearnLoop
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {user && navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {user && profile && (
              <div className="flex items-center space-x-4 border-l pl-4 ml-4">
                <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <Coins className="w-4 h-4" />
                  <span>{profile.skill_coins}</span>
                </div>
                
                <NotificationCenter />
                
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors duration-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">{profile.full_name}</span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={signOut}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!user && (
              <div className="flex items-center space-x-4">
                <Link
                  to="/auth"
                  className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && <NotificationCenter />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-purple-600 focus:outline-none focus:text-purple-600 transition-colors duration-200"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user && navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {user && profile && (
                <div className="pt-4 pb-2 border-t">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{profile.full_name}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      <Coins className="w-4 h-4" />
                      <span>{profile.skill_coins}</span>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors duration-200"
                  >
                    Edit Profile
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              )}

              {!user && (
                <div className="pt-4 pb-2 border-t space-y-2">
                  <Link
                    to="/auth"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-center text-purple-600 font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth"
                    onClick={() => setIsOpen(false)}
                    className="block mx-3 py-2 text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};