import { UserProfile, TrackSummary, LevelNode, LevelDetail, MascotOutfitItem, LeaderboardEntry, CourseTrack } from './types';

const API_BASE = '/api/v1';

export const api = {
  async getProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/user/profile`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async setActiveTrack(track: CourseTrack): Promise<void> {
    const res = await fetch(`${API_BASE}/user/active-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track }),
    });
    if (!res.ok) throw new Error('Failed to update active track');
  },

  async getTracksSummary(): Promise<TrackSummary[]> {
    const res = await fetch(`${API_BASE}/play/tracks`);
    if (!res.ok) throw new Error('Failed to fetch tracks');
    const data = await res.json();
    return data.tracks;
  },

  async getTrackProgress(track: CourseTrack): Promise<{ track: CourseTrack; levels: LevelNode[]; unlocked_level_number: number; completed_count: number }> {
    const res = await fetch(`${API_BASE}/play/track-progress/${track}`);
    if (!res.ok) throw new Error('Failed to fetch track progress');
    return res.json();
  },

  async getLevelDetails(levelId: string): Promise<LevelDetail> {
    const res = await fetch(`${API_BASE}/play/level/${levelId}`);
    if (!res.ok) throw new Error('Failed to fetch level details');
    return res.json();
  },

  async submitChallenge(levelId: string, challengeId: string, submissionData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/play/challenge/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level_id: levelId,
        challenge_id: challengeId,
        submission_data: submissionData,
      }),
    });
    if (!res.ok) throw new Error('Failed to evaluate challenge');
    return res.json();
  },

  async getSocraticHint(spiceTelemetry: any, targetGoal: any, userQuery: string, topicTag: string): Promise<string> {
    const res = await fetch(`${API_BASE}/ai/socratic-hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spice_telemetry: spiceTelemetry,
        target_goal: targetGoal,
        user_query: userQuery,
        topic_tag: topicTag,
      }),
    });
    if (!res.ok) throw new Error('Failed to get Socratic hint');
    const data = await res.json();
    return data.guidance;
  },

  async generateAdaptiveDrill(track: CourseTrack): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/generate-practice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track }),
    });
    if (!res.ok) throw new Error('Failed to generate adaptive drill');
    return res.json();
  },

  async getMascotOutfits(): Promise<{ outfits: MascotOutfitItem[]; equipped_outfit_id?: string; spark_coins: number }> {
    const res = await fetch(`${API_BASE}/mascot/outfits`);
    if (!res.ok) throw new Error('Failed to fetch outfits');
    return res.json();
  },

  async buyOutfit(outfitId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/mascot/buy-outfit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outfit_id: outfitId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Purchase failed');
    }
    return res.json();
  },

  async equipOutfit(outfitId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/mascot/equip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outfit_id: outfitId }),
    });
    if (!res.ok) throw new Error('Failed to equip outfit');
    return res.json();
  },

  async syncGoogleUser(user: { id: string; email: string; username?: string; avatar_url?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/google-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error('Failed to sync Google user');
    return res.json();
  },

  async getLeagueStandings(tier: string = 'Bronze'): Promise<{ leaderboard: LeaderboardEntry[]; league_tier: string; countdown_days: number }> {
    const res = await fetch(`${API_BASE}/analytics/league?tier=${tier}`);
    if (!res.ok) throw new Error('Failed to fetch standings');
    return res.json();
  },
};
