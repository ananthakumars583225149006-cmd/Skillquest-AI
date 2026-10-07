import React, { useState, useEffect } from 'react';
import { SpikeRhinoAvatar } from './SpikeRhinoAvatar';
import { FormattedMathText } from './KaTeXRenderer';
import { X, Send, Sparkles } from 'lucide-react';
import { api } from '../api';

interface SocraticDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  outfitCode: string;
  topicTag: string;
  measurements?: any;
  targetGoal?: any;
  activeView?: 'WORKBENCH' | 'LEVEL_NOTES' | 'KNOWLEDGE_QUEST';
  contextId?: string;
  initialPrompt?: string;
}

export const SocraticDrawer: React.FC<SocraticDrawerProps> = ({
  isOpen,
  onClose,
  outfitCode,
  topicTag,
  measurements,
  targetGoal,
  activeView = 'WORKBENCH',
  contextId = '',
  initialPrompt,
}) => {
  const getGreetingText = () => {
    if (activeView === 'LEVEL_NOTES') {
      return `Hello! I'm **Spike the Engineering Rhino**. Ready to explore the **${topicTag}** notes, formulas, and real-world examples with me?`;
    } else if (activeView === 'KNOWLEDGE_QUEST') {
      return `Welcome to the Trial of Knowledge! I'm **Spike**, here to help you synthesize the last 10 levels and prime your strategy for the **Boss Mission**! 👑⚡`;
    }
    return `Hello! I'm **Spike the Engineering Rhino**, your Socratic learning partner for **${topicTag}**. How can I guide your circuit or code analysis?`;
  };

  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'spike'; text: string }>>([
    {
      sender: 'spike',
      text: getGreetingText(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          sender: 'spike',
          text: getGreetingText(),
        },
      ]);
      if (initialPrompt) {
        setInputText(initialPrompt);
      }
    }
  }, [isOpen, activeView, topicTag]);

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
        topicTag,
        activeView,
        contextId
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

  const quickPrompts =
    activeView === 'LEVEL_NOTES'
      ? [
          "Can you explain the formula in the notes?",
          "How does the real-world example work?",
          "Break down the worked example step-by-step!",
        ]
      : activeView === 'KNOWLEDGE_QUEST'
      ? [
          "Help me review for the Boss!",
          "What emergency faults should I watch for?",
          "Give me a quick review question!",
        ]
      : [
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
                  {activeView === 'LEVEL_NOTES'
                    ? 'Notes Tutor'
                    : activeView === 'KNOWLEDGE_QUEST'
                    ? 'Boss Revision'
                    : 'Socratic AI Tutor'}
                </span>
              </h3>
              <p className="text-xs text-[#6B7280]">
                {activeView === 'LEVEL_NOTES'
                  ? 'Guiding your lesson notes and formula intuition'
                  : activeView === 'KNOWLEDGE_QUEST'
                  ? 'Synthesizing module concepts before the emergency scenario'
                  : 'Guiding your logic step-by-step with zero hallucinations'}
              </p>
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
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'spike' && (
                <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center shrink-0 mt-1">
                  <SpikeRhinoAvatar outfit={outfitCode} state="socratic" size={28} animate={false} />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#7C3AED] text-white rounded-br-none shadow-sm'
                    : 'bg-[#F9FAFB] text-[#18181B] border border-[#E5E7EB] rounded-bl-none shadow-sm'
                }`}
              >
                <FormattedMathText text={msg.text} />
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 items-center text-xs text-purple-600 font-bold animate-pulse">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-spin" />
              </div>
              <span>Spike is tuning into circuit frequencies...</span>
            </div>
          )}
        </div>

        {/* Quick Socratic Prompts */}
        <div className="px-6 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-xs bg-white hover:bg-purple-50 text-purple-700 font-semibold px-3 py-1.5 rounded-full border border-purple-200 whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[#E5E7EB] flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              activeView === 'LEVEL_NOTES'
                ? "Ask Spike about the notes or formulas..."
                : activeView === 'KNOWLEDGE_QUEST'
                ? "Ask Spike for Boss revision tips..."
                : "Ask Spike about your circuit or code..."
            }
            className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="btn-3d btn-3d-brand p-2.5 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
