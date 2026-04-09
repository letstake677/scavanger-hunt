/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Menu, X, Trophy, MapPin, Search, Gift, Lightbulb, CheckCircle2, ArrowRight, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccount } from 'wagmi'
import { modal } from './config/reown'

const HUNT_QUESTIONS = [
  {
    question: "Where are the new Engagement Quests available?",
    options: ["Twitter", "SnappQuest", "Telegram", "Discord"],
    answer: "SnappQuest",
    hint: "Check out this ",
    hintLink: "https://t.me/GetVerse/177601/514500"
  },
  {
    question: "What did the new members do in the ecosystem?",
    options: ["Trading tokens", "Creating memes", "Developing dapps", "Staking crypto"],
    answer: "Developing dapps",
    hint: "Find out more ",
    hintLink: "https://t.me/GetVerse/177601/514420"
  },
  {
    question: "When does the campaign end?",
    options: ["April 10", "April 12", "April 13, 00:00 UTC", "April 15"],
    answer: "April 13, 00:00 UTC",
    hint: "Check the deadline ",
    hintLink: "https://t.me/GetVerse/177601/514123"
  },
  {
    question: "What is the main objective?",
    options: ["Trade tokens", "Build dapps", "Create & share content on X", "Invite friends"],
    answer: "Create & share content on X",
    hint: "Read the goals ",
    hintLink: "https://t.me/GetVerse/177601/514123"
  }
];

export default function App() {
  const { address, isConnected } = useAccount()
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHuntActive, setIsHuntActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [username, setUsername] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

  const updateScore = async () => {
    if (!address) return;
    try {
      await fetch('/api/leaderboard/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          username: username || address.slice(0, 6),
          scoreIncrement: 100
        })
      });
      fetchLeaderboard();
    } catch (err) {
      console.error('Failed to update score:', err);
    }
  };

  const startHunt = () => {
    setIsHuntActive(true);
    setCurrentStep(0);
    setSelectedOption(null);
    setShowHint(false);
    setIsFinished(false);
    setIsMenuOpen(false);
  };

  const handleOptionSelect = (option: string) => {
    if (isCorrect !== null) return;
    setSelectedOption(option);
    
    const correct = option === HUNT_QUESTIONS[currentStep].answer;
    
    if (correct) {
      setIsCorrect(true);
      setTimeout(() => {
        if (currentStep < HUNT_QUESTIONS.length - 1) {
          setCurrentStep(prev => prev + 1);
          setSelectedOption(null);
          setShowHint(false);
          setIsCorrect(null);
        } else {
          setIsFinished(true);
          updateScore();
        }
      }, 1000);
    } else {
      setIsCorrect(false);
      setTimeout(() => {
        setIsCorrect(null);
        setSelectedOption(null);
      }, 1000);
    }
  };

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'How It Works', href: '#how' },
    { name: 'Leaderboard', href: '#leaderboard' },
  ];

  return (
    <div className="font-sans bg-[#1a0a3e] text-slate-900 overflow-x-hidden relative min-h-screen">
      {/* Global Background Image */}
      <img 
        src="https://i.ibb.co/kRNgxHV/hero-bg.png" 
        className="fixed inset-0 z-0 w-full h-full object-cover" 
        referrerPolicy="no-referrer"
        alt="background"
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#1a0a3e]/40 via-[#2d1b69]/30 to-[#1a0a3e]/60 backdrop-blur-[1px]"></div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-[#1a0a3e]/60 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <img 
            src="https://i.ibb.co/DHd07RDx/logo.png" 
            alt="Verse Logo" 
            className="w-10 h-10 rounded-xl object-cover"
            referrerPolicy="no-referrer"
          />
          <span className="text-2xl font-extrabold text-white">verse</span>
        </div>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="text-purple-200 hover:text-white text-sm font-semibold transition-colors"
            >
              {link.name}
            </a>
          ))}
          <button 
            onClick={() => {
              console.log('Join button clicked, calling modal.open()');
              try {
                modal.open();
              } catch (err) {
                console.error('Error calling modal.open():', err);
              }
            }}
            className="bg-gradient-to-br from-purple-500 to-purple-400 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-[0_4px_20px_rgba(168,85,247,0.5)] flex items-center gap-2"
          >
            {isConnected ? (
              <>
                <User size={16} />
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </>
            ) : (
              'Join Now'
            )}
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <button 
            onClick={() => {
              console.log('Mobile Join button clicked');
              try { modal.open(); } catch (e) { console.error(e); }
            }}
            className="bg-gradient-to-br from-purple-500 to-purple-400 text-white px-5 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-[0_4px_20px_rgba(168,85,247,0.5)]"
          >
            {isConnected ? address?.slice(0, 4) + '...' : 'Join'}
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 md:hidden pt-24 px-6 bg-[#1a0a3e]/95 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-2xl font-bold text-white hover:text-purple-400 transition-colors border-b border-white/5 pb-4"
                >
                  {link.name}
                </a>
              ))}
              <button 
                onClick={() => {
                  if (!isConnected) {
                    modal.open();
                  } else {
                    startHunt();
                  }
                  setIsMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-bold text-lg shadow-xl"
              >
                {isConnected ? 'Start Hunting' : 'Join the Community'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-32 pb-20 overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-4 drop-shadow-lg">
            Join the <span className="bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">Ultimate</span><br />Scavenger Hunt!
          </h1>
          <p className="text-purple-100 text-lg md:text-xl mb-8 drop-shadow-md max-w-2xl mx-auto">
            Explore your city, solve clues, and win big prizes!
          </p>
          <button 
            onClick={() => {
              console.log('Hero Join button clicked');
              if (!isConnected) {
                try { modal.open(); } catch (e) { console.error(e); }
              } else {
                startHunt();
              }
            }}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white px-11 py-4 rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-[0_6px_30px_rgba(168,85,247,0.5)]"
          >
            {isConnected ? 'Start Hunting' : 'Join the Community'}
          </button>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="relative z-10 px-5 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-12 text-white drop-shadow-md">
          How It <span className="text-purple-400">Works</span>
        </h2>
        <div className="flex justify-center gap-8 flex-wrap max-w-6xl mx-auto">
          
          {/* Card 1 */}
          <div className="bg-[#1a0a3e]/60 backdrop-blur-md rounded-2xl w-72 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden hover:-translate-y-2 transition-all duration-300 border border-white/10 text-left flex flex-col group">
            <div className="h-48 overflow-hidden shrink-0">
              <img 
                src="https://i.ibb.co/S7JPd914/step1.jpg" 
                alt="Join the Hunt" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6 pb-8 flex-1">
              <div className="inline-flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-purple-900/50">1</div>
                <span className="text-xl font-black text-white">Join the Hunt</span>
              </div>
              <p className="text-sm text-purple-200 leading-relaxed mt-2 font-medium">
                Sign up for the scavenger hunt on the Verse app and get ready for an adventure.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#1a0a3e]/60 backdrop-blur-md rounded-2xl w-72 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden hover:-translate-y-2 transition-all duration-300 border border-white/10 text-left flex flex-col group">
            <div className="h-48 overflow-hidden shrink-0">
              <img 
                src="https://i.ibb.co/d0DqW3vp/step2.jpg" 
                alt="Solve the Clues" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6 pb-8 flex-1">
              <div className="inline-flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-purple-900/50">2</div>
                <span className="text-xl font-black text-white">Solve the Clues</span>
              </div>
              <p className="text-sm text-purple-200 leading-relaxed mt-2 font-medium">
                Follow the clues, explore your city, and complete fun challenges to discover hidden locations.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#1a0a3e]/60 backdrop-blur-md rounded-2xl w-72 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden hover:-translate-y-2 transition-all duration-300 border border-white/10 text-left flex flex-col group">
            <div className="h-48 overflow-hidden shrink-0">
              <img 
                src="https://i.ibb.co/C3F85gRz/step3.jpg" 
                alt="Find the Treasure" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6 pb-8 flex-1">
              <div className="inline-flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-purple-900/50">3</div>
                <span className="text-xl font-black text-white">Find the Treasure</span>
              </div>
              <p className="text-sm text-purple-200 leading-relaxed mt-2 font-medium">
                Locate the final treasure, submit your answer, and win exciting prizes.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard" className="relative z-10 px-5 py-20 text-center">
        <div className="max-w-4xl mx-auto bg-[#1a0a3e]/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-12 shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Trophy className="text-yellow-400 w-8 h-8" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Top <span className="text-purple-400">Hunters</span></h2>
          </div>
          
          <div className="space-y-4">
            {leaderboard.length > 0 ? (
              leaderboard.map((user, index) => (
                <div key={user.address} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                      index === 0 ? 'from-yellow-400 to-orange-500' : 
                      index === 1 ? 'from-slate-300 to-slate-400' : 
                      index === 2 ? 'from-amber-600 to-amber-700' : 'from-purple-500 to-indigo-500'
                    } flex items-center justify-center text-white font-bold shadow-lg`}>
                      {index + 1}
                    </div>
                    <span className="text-white font-bold text-lg">{user.username}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-400 font-black text-xl">{user.score.toLocaleString()}</span>
                    <span className="text-purple-200/50 text-xs block uppercase tracking-wider font-bold">Points</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-purple-300 italic">No hunters yet. Be the first!</div>
            )}
          </div>
          
          <button className="mt-10 text-purple-300 hover:text-white font-bold transition-colors underline underline-offset-8">
            View Full Leaderboard
          </button>
        </div>
      </section>

      {/* Scavenger Hunt Modal */}
      <AnimatePresence>
        {isHuntActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a051a]/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1a0a3e] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setIsHuntActive(false)}
                className="absolute top-4 right-4 text-purple-300 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              {!isFinished ? (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-purple-400 font-bold text-sm uppercase tracking-widest">Question {currentStep + 1} of {HUNT_QUESTIONS.length}</span>
                    <div className="flex gap-1">
                      {HUNT_QUESTIONS.map((_, i) => (
                        <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i <= currentStep ? 'bg-purple-500' : 'bg-white/10'}`} />
                      ))}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-6 leading-tight">
                    {HUNT_QUESTIONS[currentStep].question}
                  </h3>

                  <div className="space-y-3 mb-6">
                    {HUNT_QUESTIONS[currentStep].options?.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect(option)}
                        disabled={isCorrect !== null}
                        className={`w-full text-left px-6 py-4 rounded-2xl border transition-all font-medium flex items-center justify-between group ${
                          selectedOption === option
                            ? isCorrect === true
                              ? 'bg-green-500/20 border-green-500 text-green-400'
                              : isCorrect === false
                              ? 'bg-red-500/20 border-red-500 text-red-400'
                              : 'bg-purple-500/20 border-purple-500 text-purple-300'
                            : 'bg-white/5 border-white/10 text-purple-200 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <span>{option}</span>
                        {selectedOption === option && isCorrect === true && <CheckCircle2 size={20} />}
                        {selectedOption === option && isCorrect === false && <X size={20} />}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowHint(!showHint)}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-purple-300 py-4 rounded-2xl font-bold transition-all"
                    >
                      <Lightbulb size={18} className={showHint ? 'text-yellow-400' : ''} />
                      {showHint ? 'Hide Hint' : 'Need a Hint?'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showHint && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl"
                      >
                        <p className="text-yellow-200 text-sm italic flex items-start gap-2">
                          <Sparkles size={14} className="shrink-0 mt-0.5" />
                          <span>
                            {HUNT_QUESTIONS[currentStep].hint}
                            {HUNT_QUESTIONS[currentStep].hintLink && (
                              <a 
                                href={HUNT_QUESTIONS[currentStep].hintLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-yellow-400 font-bold underline hover:text-yellow-300 transition-colors"
                              >
                                link
                              </a>
                            )}
                          </span>
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/20">
                    <Trophy size={40} className="text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-4">Hunt Completed!</h3>
                  <p className="text-purple-200 mb-6 leading-relaxed">
                    Amazing job, Hunter! You've solved all the clues and discovered the secrets of the Verse ecosystem.
                  </p>
                  
                  <div className="mb-8">
                    <label className="block text-purple-300 text-sm font-bold mb-2 text-left px-2">Set your Hunter Name</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={address?.slice(0, 6) || "Enter name"}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <button 
                    onClick={() => {
                      updateScore();
                      setIsHuntActive(false);
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl"
                  >
                    Claim Your Reward & Save Score
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 bg-[#1a0a3e]/80 backdrop-blur-md border-t border-white/10 py-10 px-5 text-center">
        <p className="text-purple-300 text-sm">
          &copy; 2026 Verse. All rights reserved. <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">Privacy</a> &middot; <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">Terms</a>
        </p>
      </footer>
    </div>
  );
}
