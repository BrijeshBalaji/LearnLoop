import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { findMatches, MatchResult } from '../utils/matching';

export const useMatches = () => {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!profile) {
        setLoading(false);
        setMatches([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const matchResults = await findMatches(profile.id);
        setMatches(matchResults);
      } catch (err) {
        setError('Failed to load matches');
        setMatches([]);
        console.error('Error fetching matches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [profile]);

  const refetch = async () => {
    if (profile) {
      setLoading(true);
      try {
      const matchResults = await findMatches(profile.id);
      setMatches(matchResults);
      } catch (error) {
        setError('Failed to load matches');
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    matches,
    loading,
    error,
    refetch,
  };
};