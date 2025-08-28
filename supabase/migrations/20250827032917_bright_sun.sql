/*
  # Update matching system for mutual work exchange

  1. Functions
    - Add function to find mutual matches
    - Update reward messages for work exchange context
  
  2. Changes
    - Focus on mutual skill matching (bidirectional needs)
    - Update reward descriptions for work exchange
*/

-- Function to find mutual matches
CREATE OR REPLACE FUNCTION get_mutual_matches(requesting_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  user_name text,
  user_email text,
  skill_coins integer,
  offered_skill_id uuid,
  offered_skill_name text,
  needed_skill_id uuid,
  needed_skill_name text,
  compatibility_score integer
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_offered AS (
    SELECT us.skill_id, s.name as skill_name
    FROM user_skills us
    JOIN skills s ON us.skill_id = s.id
    WHERE us.user_id = requesting_user_id AND us.type = 'offered'
  ),
  user_needed AS (
    SELECT us.skill_id, s.name as skill_name
    FROM user_skills us
    JOIN skills s ON us.skill_id = s.id
    WHERE us.user_id = requesting_user_id AND us.type = 'needed'
  )
  SELECT DISTINCT
    p.id as user_id,
    p.full_name as user_name,
    p.email as user_email,
    p.skill_coins,
    uo.skill_id as offered_skill_id,
    uo.skill_name as offered_skill_name,
    un.skill_id as needed_skill_id,
    un.skill_name as needed_skill_name,
    95 as compatibility_score -- High compatibility for mutual matches
  FROM profiles p
  JOIN user_skills us_needed ON p.id = us_needed.user_id
  JOIN user_skills us_offered ON p.id = us_offered.user_id
  JOIN user_offered uo ON us_needed.skill_id = uo.skill_id
  JOIN user_needed un ON us_offered.skill_id = un.skill_id
  WHERE p.id != requesting_user_id
    AND us_needed.type = 'needed'
    AND us_offered.type = 'offered';
END;
$$;

-- Update the award_skill_coins function to use work exchange terminology
CREATE OR REPLACE FUNCTION award_skill_coins(
  user_id uuid,
  amount integer,
  reason text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update user's skill coins
  UPDATE profiles 
  SET skill_coins = skill_coins + amount,
      updated_at = now()
  WHERE id = user_id;
  
  -- Insert reward record
  INSERT INTO rewards (user_id, type, amount, earned_for)
  VALUES (user_id, 'skill_coins', amount, reason);
END;
$$;