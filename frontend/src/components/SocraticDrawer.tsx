import React, { useState } from 'react';
import { SpikeRhinoAvatar } from './SpikeRhinoAvatar';
import { FormattedMathText } from './KaTeXRenderer';
import { X, Send, Sparkles, HelpCircle } from 'lucide-react';
import { api } from '../api';

interface SocraticDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  outfitCode: string;
  topicTag: string;
  measurements: any;
  targetGoal: any;
}

export const SocraticDrawer: React.FC<SocraticDrawerProps> = ({
  isOpen,
  onClose,
  outfitCode,
  topicTag,
  measurements,
  targetGoal,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'spike'; text: string }>>([
    {
      sender: 'spike',
      text: `Hello! I'm **Spike the Engineering Rhino**, your Socratic learning partner for **${topicTag}**. How can I guide your circuit or code analysis?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg = { sender: 'user' as const, text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const guidance = await api.getSocraticHint(
        measurements || {},
        targetGoal || {},
        textToSend,
        topicTag
      );
      setMessages((prev) => [...prev, { sender: 'spike', text: guidance }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'spike',
          text: '🦏 **Spike says:** Think about the fundamental circuit node relationships. What does Kirchhoff\'s Current Law $\\sum I = 0$ tell us about this junction?',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Why doesn't my output match the target?",
    "Which formula should I apply here?",
    "Can you give me a Socratic nudge?",
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-2xl bg-white border-2 border-[#A78BFA] rounded-t-3xl shadow-2xl pointer-events-auto flex flex-col max-h-[80vh] transition-transform duration-300">
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-[#F3EEFF] border-b border-[#E5E7EB] rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl border border-[#A78BFA] flex items-center justify-center shadow-sm overflow-hidden">
              <SpikeRhinoAvatar outfit={outfitCode} state="socratic" size={48} animate={false} />
            </div>
            <div>
              <h3 className="font-extrabold text-[#18181B] text-base flex items-center gap-2">
                <span>Spike the Engineering Rhino</span>
                <span className="px-2 py-0.5 rounded-full bg-[#7C3AED] text-white text-[11px] font-bold">
                  Socratic AI Tutor
                </span>
              </h3>
              <p className="text-xs text-[#6B7280]">Guiding your logic step-by-step with zero hallucinations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation Stream */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 max-h-[45vh]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.sender === 'spike' ? (
                <div className="w-8 h-8 rounded-full bg-[#F3EEFF] border border-[#A78BFA] flex-shrink-0 flex items-center justify-center text-sm">
                  🦏
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-300 flex-shrink-0 flex items-center justify-center text-xs font-bold text-[#7C3AED]">
                  YOU
                </div>
              )}
              <div
                className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#7C3AED] text-white rounded-tr-none'
                    : 'bg-[#FAFAFC] text-[#18181B] border border-[#E5E7EB] rounded-tl-none'
                }`}
              >
                <FormattedMathText text={msg.text} />
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3 text-sm text-[#7C3AED] font-medium italic">
              <Sparkles className="w-4 h-4 animate-spin" />
              Spike is calculating circuit physics and preparing your hint...
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-6 py-2 bg-gray-50/80 border-t border-gray-100 flex items-center gap-2 overflow-x-auto">
          {quickPrompts.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="text-xs bg-white hover:bg-[#F3EEFF] hover:text-[#7C3AED] border border-[#E5E7EB] text-[#4B5563] px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input Deck */}
        <div className="p-4 bg-white border-t border-[#E5E7EB] flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Spike a question about your circuit or code..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#7C3AED] text-sm text-[#18181B]"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputText.trim()}
            className="btn-3d btn-3d-brand px-4 py-2.5 rounded-xl flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
