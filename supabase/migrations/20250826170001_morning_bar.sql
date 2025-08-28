/*
  # Add RPC Functions for LearnLoop

  1. Functions
    - `award_skill_coins` - Function to award SkillCoins to users
    - `get_user_matches` - Function to find potential skill matches
    - `update_swap_status` - Function to update swap status and award coins

  2. Security
    - Functions are accessible to authenticated users only
*/

-- Function to award skill coins
CREATE OR REPLACE FUNCTION award_skill_coins(
  user_id UUID,
  amount INTEGER,
  reason TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update user's skill coins
  UPDATE profiles 
  SET 
    skill_coins = skill_coins + amount,
    updated_at = now()
  WHERE id = user_id;

  -- If completing a swap, also update total swaps
  IF reason LIKE '%swap%' THEN
    UPDATE profiles 
    SET total_swaps_completed = total_swaps_completed + 1
    WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get potential matches
CREATE OR REPLACE FUNCTION get_user_matches(requesting_user_id UUID)
RETURNS TABLE (
  matched_user_id UUID,
  skill_id UUID,
  skill_name TEXT,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH my_skills AS (
    SELECT skill_id, type FROM user_skills WHERE user_id = requesting_user_id
  ),
  my_offered AS (
    SELECT skill_id FROM my_skills WHERE type = 'offered'
  ),
  my_needed AS (
    SELECT skill_id FROM my_skills WHERE type = 'needed'
  )
  SELECT DISTINCT
    us.user_id as matched_user_id,
    us.skill_id,
    s.name as skill_name,
    us.type as match_type
  FROM user_skills us
  JOIN skills s ON us.skill_id = s.id
  WHERE us.user_id != requesting_user_id
    AND (
      (us.type = 'offered' AND us.skill_id IN (SELECT skill_id FROM my_needed))
      OR
      (us.type = 'needed' AND us.skill_id IN (SELECT skill_id FROM my_offered))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION award_skill_coins TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_matches TO authenticated;