export type CourseTrack = 'EEE' | 'CSE' | 'ECE';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  active_track: CourseTrack;
  xp: number;
  spark_coins: number;
  streak_days: number;
  hearts: number;
  max_hearts: number;
  equipped_outfit_code: string;
  equipped_outfit_id?: string;
  current_league: string;
}

export interface TrackSummary {
  track: CourseTrack;
  name: string;
  accent_color: string;
  total_levels: number;
  completed_levels: number;
  unlocked_level_number: number;
  progress_percent: number;
  badge_text: string;
}

export interface LevelNode {
  id: string;
  level_number: number;
  module_index: number;
  title: string;
  topic_tag: string;
  learning_objective: string;
  is_boss_level: boolean;
  boss_scenario_brief?: string;
  is_unlocked: boolean;
  is_completed: boolean;
  stars: number;
  xp_reward: number;
  coin_reward: number;
  has_decay_alert: boolean;
  mastery_score: number;
}

export interface ChallengeData {
  id: string;
  order_index: number;
  challenge_type: 'SPICE_CIRCUIT' | 'CODE_DEBUG' | 'TRUTH_TABLE' | 'SLIDER_TUNING' | 'PHASOR_ALIGN';
  prompt_text: string;
  initial_state: any;
  target_state: any;
  hints: string[];
  difficulty_rating: number;
}

export interface LevelDetail {
  id: string;
  track: CourseTrack;
  module_index: number;
  level_number: number;
  title: string;
  topic_tag: string;
  learning_objective: string;
  prerequisite: string;
  short_lesson_markdown: string;
  is_boss_level: boolean;
  boss_scenario_brief?: string;
  xp_reward: number;
  coin_reward: number;
  challenges: ChallengeData[];
}

export interface MascotOutfitItem {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'TRACK' | 'CULTURAL' | 'ACHIEVEMENT' | 'BOSS';
  image_layer_url: string;
  price_coins: number;
  unlock_required_badge?: string;
  is_unlocked: boolean;
  is_equipped: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar_url?: string;
  weekly_xp: number;
  is_current_user: boolean;
  zone: 'promotion' | 'relegation' | 'safe';
}
