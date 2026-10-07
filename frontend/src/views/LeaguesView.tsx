import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, UserProfile } from '../types';
import { api } from '../api';
import { soundManager } from '../utils/soundManager';
import { Trophy, Shield, ChevronUp, ChevronDown, Clock, Sparkles, RefreshCw, Award } from 'lucide-react';

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
    soundManager.startAmbient();
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in select-none">
      {/* WOODEN CARVED TROPHY BOARD HEADER */}
      <div className="bg-gradient-to-b from-[#92400E] via-[#78350F] to-[#451A03] border-4 border-[#B45309] rounded-3xl p-6 sm:p-8 shadow-[0_8px_0_#291305,0_16px_32px_rgba(0,0,0,0.5)] text-amber-100 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 text-center sm:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-black shadow-xs">
            <Trophy className="w-3.5 h-3.5 fill-current" />
            <span>Weekly Real-Player Tournament</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-amber-50 tracking-tight drop-shadow">
            {tier} Trophy Board
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/90 font-bold max-w-md">
            Top 3 engineers earn promotion to the next tier! Compete with live players in the 30-player bracket.
          </p>
        </div>

        {/* Carved Countdown Sign */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#5B290B] border-2 border-[#B45309] shadow-inner flex items-center gap-3 text-amber-200 z-10">
          <Clock className="w-6 h-6 text-amber-400" />
          <div>
            <div className="text-[10px] text-amber-400 uppercase tracking-wider font-black">Division Reset</div>
            <div className="font-extrabold text-sm text-amber-50">{countdownDays} Days Left</div>
          </div>
        </div>
      </div>

      {/* TIER BADGES */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 justify-center">
        {TIERS.map((t) => {
          const isActive = t === tier;
          return (
            <div
              key={t}
              className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-default ${
                isActive
                  ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-300 text-amber-950 shadow-[0_4px_0_#78350F] scale-105'
                  : 'bg-stone-800/90 border-2 border-stone-600 text-stone-300'
              }`}
            >
              <Shield className="w-3.5 h-3.5 fill-current" />
              <span>{t}</span>
            </div>
          );
        })}
      </div>

      {/* CARVED WOODEN TROPHY BOARD LIST */}
      <div className="bg-gradient-to-b from-[#78350F] via-[#5B290B] to-[#3B1907] border-4 border-[#92400E] rounded-3xl shadow-[0_8px_0_#1E0D03,0_16px_32px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Table Banner */}
        <div className="px-6 py-4 bg-[#451A03] border-b-2 border-[#92400E] flex items-center justify-between text-xs font-black text-amber-300 uppercase tracking-wider">
          <span>Rank & Engineer</span>
          <span>Weekly Experience</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-amber-300">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
            <p className="text-xs font-black mt-3">Fetching live league standings...</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-[#451A03]/60">
            {standings.map((entry) => {
              const isPromo = entry.zone === 'promotion';
              const isReleg = entry.zone === 'relegation';

              return (
                <div
                  key={entry.rank}
                  className={`px-6 py-4 flex items-center justify-between transition-colors ${
                    entry.is_current_user
                      ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/20 font-black border-l-4 border-amber-400'
                      : 'hover:bg-amber-950/40 text-amber-100'
                  }`}
                >
                  {/* Left: Rank & Username */}
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm bg-black/30 border border-amber-600/40 shadow-inner">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-2xl bg-amber-200 border-2 border-amber-500 flex items-center justify-center text-lg overflow-hidden shadow-sm">
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt={entry.username} className="w-full h-full object-cover" />
                        ) : entry.is_current_user ? (
                          '🦏'
                        ) : (
                          '⚡'
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-black flex items-center gap-2 text-amber-50">
                          <span>{entry.username}</span>
                          {entry.is_current_user && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 shadow-xs">
                              YOU
                            </span>
                          )}
                        </div>
                        {isPromo && (
                          <div className="text-[11px] text-emerald-300 font-extrabold flex items-center gap-0.5 mt-0.5">
                            <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Promotion Zone (+1 Tier)</span>
                          </div>
                        )}
                        {isReleg && (
                          <div className="text-[11px] text-rose-300 font-extrabold flex items-center gap-0.5 mt-0.5">
                            <ChevronDown className="w-3.5 h-3.5 text-rose-400" />
                            <span>Relegation Zone</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: XP Score */}
                  <div className="font-mono font-black text-sm text-amber-300 bg-black/40 px-3 py-1.5 rounded-xl border border-amber-700/50 shadow-inner">
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
