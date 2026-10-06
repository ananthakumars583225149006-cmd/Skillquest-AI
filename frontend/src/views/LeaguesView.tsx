import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, UserProfile } from '../types';
import { api } from '../api';
import { Trophy, Shield, ChevronUp, ChevronDown, Clock, Sparkles, RefreshCw } from 'lucide-react';

interface LeaguesViewProps {
  profile: UserProfile | null;
}

export const LeaguesView: React.FC<LeaguesViewProps> = ({ profile }) => {
  const [standings, setStandings] = useState<LeaderboardEntry[]>([]);
  const [tier, setTier] = useState('Bronze');
  const [countdownDays, setCountdownDays] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStandings();
  }, [profile?.current_league]);

  const loadStandings = async () => {
    setLoading(true);
    try {
      const data = await api.getLeagueStandings(profile?.current_league || 'Bronze');
      setStandings(data.leaderboard);
      setTier(data.league_tier);
      setCountdownDays(data.countdown_days);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Quantum'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* League Header Banner */}
      <div className="bg-white border-2 border-[#E5E7EB] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 text-center sm:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3EEFF] text-[#7C3AED] text-xs font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>Weekly Quantum Division</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#18181B] tracking-tight">
            {tier} League Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Top 3 advance to the next tier! Solve circuits and challenges to earn weekly XP.
          </p>
        </div>

        {/* Countdown Pill */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900 font-bold text-xs sm:text-sm z-10">
          <Clock className="w-5 h-5 text-amber-600" />
          <div>
            <div className="text-[10px] text-amber-700 uppercase tracking-wider font-extrabold">Resets Sunday</div>
            <div>{countdownDays} Days Remaining</div>
          </div>
        </div>
      </div>

      {/* Tier Badges Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 justify-center">
        {TIERS.map((t) => {
          const isActive = t === tier;
          return (
            <div
              key={t}
              className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#7C3AED] text-white shadow-sm ring-4 ring-purple-100 scale-105'
                  : 'bg-white border border-[#E5E7EB] text-[#6B7280]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{t}</span>
            </div>
          );
        })}
      </div>

      {/* 30-Player Standings Table */}
      <div className="bg-white border-2 border-[#E5E7EB] rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Rank & Student</span>
          <span>Weekly XP</span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#7C3AED]" />
            <p className="text-xs font-bold text-gray-500 mt-2">Loading league standings...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {standings.map((entry) => {
              const isPromo = entry.zone === 'promotion';
              const isReleg = entry.zone === 'relegation';

              return (
                <div
                  key={entry.rank}
                  className={`px-6 py-3.5 flex items-center justify-between transition-colors ${
                    entry.is_current_user
                      ? 'bg-[#F3EEFF] font-extrabold text-[#7C3AED]'
                      : 'hover:bg-gray-50/70 text-[#18181B]'
                  }`}
                >
                  {/* Left: Rank & Username */}
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex items-center justify-center font-black text-sm">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs">
                        {entry.is_current_user ? '🦏' : '⚡'}
                      </div>
                      <div>
                        <div className="text-sm font-bold flex items-center gap-2">
                          <span>{entry.username}</span>
                          {entry.is_current_user && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#7C3AED] text-white">
                              YOU
                            </span>
                          )}
                        </div>
                        {isPromo && (
                          <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <ChevronUp className="w-3 h-3" /> Promotion Zone
                          </div>
                        )}
                        {isReleg && (
                          <div className="text-[10px] text-rose-500 font-bold flex items-center gap-0.5">
                            <ChevronDown className="w-3 h-3" /> Relegation Zone
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: XP Score */}
                  <div className="font-mono font-bold text-sm">
                    {entry.weekly_xp} XP
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
