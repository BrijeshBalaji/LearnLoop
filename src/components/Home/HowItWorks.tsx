import React from 'react';
import { Search, MessageCircle, CheckCircle, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: Search,
      title: 'Find Work Partners',
      description: 'Browse available skills and find professionals who need what you offer while offering what you need.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: MessageCircle,
      title: 'Connect & Chat',
      description: 'Send a swap request and start chatting to coordinate your work exchange.',
      color: 'from-blue-500 to-purple-500',
    },
    {
      icon: CheckCircle,
      title: 'Complete the Swap',
      description: 'Collaborate (virtually or in-person) to exchange work and mark the swap as complete.',
      color: 'from-teal-500 to-blue-500',
    },
    {
      icon: Award,
      title: 'Earn Rewards',
      description: 'Get SkillCoins, unlock badges, and build your reputation in the work exchange community.',
      color: 'from-green-500 to-teal-500',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">How LearnLoop Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Getting started is simple. Follow these four easy steps to begin your work exchange journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative mb-8">
                <div className={`w-20 h-20 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 transform hover:scale-110 transition-all duration-300 shadow-lg`}>
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-1/2 transform translate-x-10 w-32 h-0.5 bg-gradient-to-r from-gray-200 to-gray-300"></div>
                )}
                <div className="w-8 h-8 bg-white border-4 border-gray-200 rounded-full flex items-center justify-center mx-auto -mt-4 relative z-10">
                  <span className="text-sm font-bold text-gray-600">{index + 1}</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Trading?</h3>
            <p className="text-gray-600 mb-6">Join thousands of professionals already exchanging work on LearnLoop</p>
            <a
              href="/auth"
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Start Trading Today
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};