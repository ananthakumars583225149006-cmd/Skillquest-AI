import React, { useState, useEffect } from 'react';
import { MascotOutfitItem, UserProfile } from '../types';
import { SpikeRhinoAvatar } from '../components/SpikeRhinoAvatar';
import { api } from '../api';
import { soundManager } from '../utils/soundManager';
import { Shirt, Check, Lock, Coins, Sparkles, RefreshCw } from 'lucide-react';

interface WardrobeViewProps {
  profile: UserProfile | null;
  onRefreshProfile: () => void;
}

export const WardrobeView: React.FC<WardrobeViewProps> = ({
  profile,
  onRefreshProfile,
}) => {
  const [outfits, setOutfits] = useState<MascotOutfitItem[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<MascotOutfitItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await api.getMascotOutfits();
      setOutfits(data.outfits);
      // Default selected is currently equipped outfit or first
      const equipped = data.outfits.find((o) => o.is_equipped) || data.outfits[0];
      setSelectedOutfit(equipped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEquip = async (outfit: MascotOutfitItem) => {
    setActionLoading(true);
    setMessage(null);
    try {
      await api.equipOutfit(outfit.id);
      soundManager.playCoinPickup();
      setMessage(`Spike equipped ${outfit.name}!`);
      await loadCatalog();
      onRefreshProfile();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuy = async (outfit: MascotOutfitItem) => {
    setActionLoading(true);
    setMessage(null);
    try {
      await api.buyOutfit(outfit.id);
      soundManager.playCoinPickup();
      setMessage(`Unlocked ${outfit.name}!`);
      await loadCatalog();
      onRefreshProfile();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#7C3AED]" />
        <p className="text-sm font-bold text-[#6B7280] mt-3">Loading Rhino Wardrobe...</p>
      </div>
    );
  }

  const previewCode = selectedOutfit?.code || profile?.equipped_outfit_code || 'EEE_HIGH_VOLTAGE';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3EEFF] text-[#7C3AED] text-xs font-bold">
          <Shirt className="w-3.5 h-3.5" />
          <span>Rhino Dressing Room & Cosmetics</span>
        </div>
        <h1 className="text-3xl font-black text-[#18181B] tracking-tight">
          Spike's Wardrobe Engine
        </h1>
        <p className="text-sm text-[#6B7280]">
          Customize your learning companion with Track Gear, Cultural Costumes, and Boss Slayer Armor.
        </p>
      </div>

      {/* Main Wardrobe Stage */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Avatar Dressing Stage (5 Cols) */}
        <div className="md:col-span-5 bg-white border-2 border-[#E5E7EB] rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-5 sticky top-24">
          <div className="w-56 h-56 rounded-full bg-gradient-to-b from-[#F3EEFF] to-[#FAFAFC] border-2 border-[#A78BFA] flex items-center justify-center p-4 shadow-inner relative">
            <SpikeRhinoAvatar outfit={previewCode} state="excited" size={190} />
            <div className="absolute bottom-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur border border-gray-200 text-[11px] font-bold text-[#18181B] shadow-xs">
              Live Preview
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-[#18181B]">
              {selectedOutfit?.name}
            </h3>
            <p className="text-xs text-[#6B7280] max-w-xs">
              {selectedOutfit?.description}
            </p>
          </div>

          {/* Action on Selected Outfit */}
          {selectedOutfit && (
            <div className="w-full pt-2">
              {selectedOutfit.is_equipped ? (
                <div className="w-full py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#10B981] font-bold text-sm flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Currently Equipped</span>
                </div>
              ) : selectedOutfit.is_unlocked ? (
                <button
                  onClick={() => handleEquip(selectedOutfit)}
                  disabled={actionLoading}
                  className="btn-3d btn-3d-brand w-full py-3 rounded-2xl font-bold text-sm"
                >
                  Equip on Spike
                </button>
              ) : selectedOutfit.price_coins > 0 ? (
                <button
                  onClick={() => handleBuy(selectedOutfit)}
                  disabled={actionLoading || (profile?.spark_coins ?? 0) < selectedOutfit.price_coins}
                  className="btn-3d btn-3d-ece w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Coins className="w-4 h-4 fill-current" />
                  <span>Unlock for {selectedOutfit.price_coins} Coins</span>
                </button>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-500 font-medium">
                  {selectedOutfit.unlock_required_badge || 'Requires completing Track Milestone'}
                </div>
              )}
            </div>
          )}

          {message && (
            <div className="text-xs font-bold text-[#7C3AED] bg-[#F3EEFF] p-2 rounded-xl w-full">
              {message}
            </div>
          )}
        </div>

        {/* Right: Outfit Catalog Grid (7 Cols) */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <span className="text-xs font-bold uppercase text-[#6B7280]">
              Available Outfits ({outfits.length})
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#F59E0B]">
              <Coins className="w-4 h-4 fill-current" />
              <span>{profile?.spark_coins ?? 0} Coins in Wallet</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {outfits.map((o) => {
              const isSelected = selectedOutfit?.id === o.id;

              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedOutfit(o)}
                  className={`bg-white border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md flex items-center gap-3 relative ${
                    isSelected ? 'border-[#7C3AED] ring-2 ring-purple-100' : 'border-[#E5E7EB]'
                  }`}
                >
                  {/* Mini Avatar Thumbnail */}
                  <div className="w-14 h-14 rounded-xl bg-[#FAFAFC] border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <SpikeRhinoAvatar outfit={o.code} state="neutral" size={48} animate={false} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs sm:text-sm text-[#18181B] truncate">
                        {o.name}
                      </h4>
                    </div>
                    <span className="text-[10px] font-semibold text-[#6B7280] block truncate">
                      {o.category} OUTFIT
                    </span>

                    <div className="mt-1 flex items-center gap-2">
                      {o.is_equipped ? (
                        <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Equipped
                        </span>
                      ) : o.is_unlocked ? (
                        <span className="text-[10px] font-bold text-[#7C3AED]">Unlocked</span>
                      ) : o.price_coins > 0 ? (
                        <span className="text-[10px] font-bold text-[#F59E0B] flex items-center gap-0.5">
                          <Coins className="w-3 h-3 fill-current" /> {o.price_coins}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5">
                          <Lock className="w-3 h-3" /> Badge
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
