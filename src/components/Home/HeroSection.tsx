import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Trophy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const HeroSection: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Work. Trade.{' '}
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
              Swap.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto"
          >
            Connect with professionals to swap skills and get work done. Trade your expertise for the services you need.
            Earn SkillCoins and unlock achievements through successful work exchanges.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
          >
            <Link
              to="/auth"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Get Started
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </Link>
            <Link
              to="#how-it-works"
              className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-200"
            >
              How It Works
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Matching</h3>
              <p className="text-gray-600">
                Our algorithm connects you with professionals who need what you offer and can provide what you need.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Earn Rewards</h3>
              <p className="text-gray-600">
                Complete work exchanges to earn SkillCoins, unlock badges, and climb the leaderboard.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-green-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Efficient Exchange</h3>
              <p className="text-gray-600">
                Focus on specific skills for efficient work exchange. Get your projects done through skill bartering.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};