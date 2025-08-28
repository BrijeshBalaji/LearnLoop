import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Skill, UserSkill } from '../lib/supabase';
import { Plus, X, User, BookOpen, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const Profile: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
  });
  const [selectedSkill, setSelectedSkill] = useState('');
  const [skillType, setSkillType] = useState<'offered' | 'needed'>('offered');
  const [proficiencyLevel, setProficiencyLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
      });
    }
    fetchSkills();
    if (profile) {
      fetchUserSkills();
    }
  }, [profile]);

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching skills:', error);
      setSkills([]);
    }

    setSkills(data || []);
  };

  const fetchUserSkills = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('user_skills')
      .select(`
        *,
        skills (*)
      `)
      .eq('user_id', profile.id);

    if (error) {
      console.error('Error fetching user skills:', error);
      setUserSkills([]);
    }

    setUserSkills(data || []);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(formData);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!selectedSkill || !profile) return;

    // Check if skill already exists for this user and type
    const existingSkill = userSkills.find(
      us => us.skill_id === selectedSkill && us.type === skillType
    );

    if (existingSkill) {
      toast.error('You already have this skill in your list');
      return;
    }

    const { error } = await supabase
      .from('user_skills')
      .insert([
        {
          user_id: profile.id,
          skill_id: selectedSkill,
          type: skillType,
          proficiency_level: proficiencyLevel,
        },
      ]);

    if (error) {
      toast.error('Error adding skill');
      console.error('Error adding skill:', error);
      return;
    }

    toast.success('Skill added successfully!');
    
    // Check if user has both offered and needed skills, then redirect to match page
    const updatedUserSkills = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', profile.id);

    if (updatedUserSkills.data) {
      const hasOffered = updatedUserSkills.data.some(s => s.type === 'offered');
      const hasNeeded = updatedUserSkills.data.some(s => s.type === 'needed');
      
      if (hasOffered && hasNeeded) {
        toast.success('Great! You have skills to offer and learn. Let\'s find your matches!', {
          duration: 3000,
        });
        setTimeout(() => {
          window.location.href = '/match';
        }, 2000);
      }
    }

    setSelectedSkill('');
    fetchUserSkills();
  };

  const handleRemoveSkill = async (skillId: string) => {
    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('id', skillId);

    if (error) {
      toast.error('Error removing skill');
      console.error('Error removing skill:', error);
      return;
    }

    toast.success('Skill removed successfully!');
    fetchUserSkills();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const offeredSkills = userSkills.filter(us => us.type === 'offered');
  const neededSkills = userSkills.filter(us => us.type === 'needed');

  if (!profile) {
    return null; // Let the app-level auth handle this
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-12">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{profile.full_name}</h1>
                <p className="text-purple-100">{profile.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    <span className="text-white text-sm font-medium">
                      {profile.skill_coins} SkillCoins
                    </span>
                  </div>
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    <span className="text-white text-sm font-medium">
                      {profile.total_swaps_completed} Swaps Completed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Profile Form */}
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <User className="w-6 h-6 mr-2 text-purple-600" />
                Profile Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Tell us about yourself and your learning goals..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>

            {/* Add Skills */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Plus className="w-6 h-6 mr-2 text-purple-600" />
                Add Skills
              </h2>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skill</label>
                    <select
                      value={selectedSkill}
                      onChange={(e) => setSelectedSkill(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select a skill</option>
                      {skills.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={skillType}
                      onChange={(e) => setSkillType(e.target.value as 'offered' | 'needed')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="offered">Can Offer</option>
                      <option value="needed">Need Done</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                    <select
                      value={proficiencyLevel}
                      onChange={(e) => setProficiencyLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleAddSkill}
                      disabled={!selectedSkill}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Add Skill
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Skills I Can Teach */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                  Skills I Can Offer ({offeredSkills.length})
                </h3>
                <div className="space-y-3">
                  {offeredSkills.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No skills added yet</p>
                  ) : (
                    offeredSkills.map((userSkill) => (
                      <div
                        key={userSkill.id}
                        className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">{userSkill.skills.name}</h4>
                          <p className="text-sm text-gray-600 capitalize">{userSkill.proficiency_level} level</p>
                        </div>
                        <button
                          onClick={() => handleRemoveSkill(userSkill.id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Skills I Want to Learn */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-600" />
                  Skills I Need Done ({neededSkills.length})
                </h3>
                <div className="space-y-3">
                  {neededSkills.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No skills added yet</p>
                  ) : (
                    neededSkills.map((userSkill) => (
                      <div
                        key={userSkill.id}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900">{userSkill.skills.name}</h4>
                          <p className="text-sm text-gray-600">Need {userSkill.proficiency_level} level work</p>
                        </div>
                        <button
                          onClick={() => handleRemoveSkill(userSkill.id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};