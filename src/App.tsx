/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Menu, X, Trophy, MapPin, Search, Gift, Lightbulb, CheckCircle2, ArrowRight, Sparkles, User, Mail, MessageCircle, Twitter, Send, ExternalLink, ShieldAlert, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccount, useDisconnect, useBalance } from 'wagmi'
import { modal } from './config/reown'
import { formatEther } from 'viem'

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

const SOUNDS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Success chime
  incorrect: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Low thud/error
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Level up/Win
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' // Subtle click
};

export default function App() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHuntActive, setIsHuntActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [hasCompleted, setHasCompleted] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const playSound = (soundUrl: string) => {
    const audio = new Audio(soundUrl);
    audio.volume = 0.4;
    audio.play().catch(e => console.log('Audio play blocked by browser:', e));
  };

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (address) {
      fetchUserStatus();
    } else {
      setHasCompleted(false);
      setUsername('');
    }
  }, [address]);

  const fetchUserStatus = async () => {
    try {
      const res = await fetch(`/api/user/${address.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        setHasCompleted(data.hasCompletedInitialHunt);
        if (data.username) setUsername(data.username);
      }
    } catch (err) {
      console.error('Failed to fetch user status:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from leaderboard API');
      }
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

  const updateScore = async () => {
    if (!address || hasSaved) return;
    try {
      const normalizedAddress = address.toLowerCase();
      console.log('Sending score update for:', normalizedAddress);
      
      const res = await fetch('/api/leaderboard/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: normalizedAddress,
          username: username || address?.slice(0, 6) || "Hunter",
          scoreIncrement: correctCount * 25 // 25 points per correct answer (total 100 for 4 questions)
        })
      });
      
      const contentType = res.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Server returned non-JSON response:', text);
        throw new Error(`Server returned ${res.status} ${res.statusText}. Please check the server logs.`);
      }
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }
      
      console.log('Score update successful:', data);
      playSound(SOUNDS.success);
      setHasSaved(true);
      setHasCompleted(true);
      setStatusMessage({ type: 'success', text: 'Score saved successfully!' });
      fetchLeaderboard();
    } catch (err: any) {
      console.error('Failed to update score:', err);
      setStatusMessage({ type: 'error', text: `Failed to save score: ${err.message}` });
    }
  };

  const startHunt = () => {
    setIsHuntActive(true);
    setCurrentStep(0);
    setCorrectCount(0);
    setSelectedOption(null);
    setShowHint(false);
    setIsFinished(false);
    setIsMenuOpen(false);
    setHasSaved(false);
    setIsCorrect(null);
  };

  const handleOptionSelect = (option: string) => {
    if (isCorrect !== null) return;
    setSelectedOption(option);
    
    const correct = option === HUNT_QUESTIONS[currentStep].answer;
    setIsCorrect(correct);
    
    if (correct) {
      setCorrectCount(prev => prev + 1);
      playSound(SOUNDS.correct);
    } else {
      playSound(SOUNDS.incorrect);
    }
    
    // Move to next question after a short delay regardless of answer
    setTimeout(() => {
      if (currentStep < HUNT_QUESTIONS.length - 1) {
        setCurrentStep(prev => prev + 1);
        setSelectedOption(null);
        setShowHint(false);
        setIsCorrect(null);
      } else {
        setIsFinished(true);
      }
    }, 1000);
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

      {/* Status Messages */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-3 border ${
              statusMessage.type === 'success' 
                ? 'bg-green-500/90 border-green-400 text-white' 
                : 'bg-red-500/90 border-red-400 text-white'
            }`}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={20} /> : <X size={20} />}
            {statusMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

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
          
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col items-end mr-2">
                  <span className="text-white text-xs font-bold">{address?.slice(0, 6) + '...' + address?.slice(-4)}</span>
                  {balance && (
                    <span className="text-purple-300 text-[10px] font-mono">
                      {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => modal.open({ view: 'Account' })}
                  className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors border border-white/10"
                >
                  <User size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => modal.open()}
                className="bg-gradient-to-br from-purple-500 to-purple-400 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-[0_4px_20px_rgba(168,85,247,0.5)] flex items-center gap-2"
              >
                Connect Wallet
              </button>
            )}
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
              {isConnected && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-300 text-xs font-bold uppercase">Wallet Connected</span>
                    <button 
                      onClick={() => modal.open({ view: 'Account' })}
                      className="text-white text-xs font-bold underline"
                    >
                      Manage
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <User size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                      {balance && (
                        <p className="text-purple-300 text-xs font-mono">
                          {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                {isConnected ? (hasCompleted ? 'Play Again' : 'Start Hunting') : 'Connect Wallet'}
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
                modal.open();
              } else {
                startHunt();
              }
            }}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white px-11 py-4 rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-[0_6px_30px_rgba(168,85,247,0.5)]"
          >
            {isConnected ? (hasCompleted ? 'Play Again' : 'Start Hunting') : 'Connect Wallet'}
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
                  <h3 className="text-3xl font-black text-white mb-2">Hunt Completed!</h3>
                  <div className="inline-block bg-purple-500/20 border border-purple-500/30 px-6 py-2 rounded-full mb-6">
                    <span className="text-2xl font-black text-purple-400">Result: {correctCount} / {HUNT_QUESTIONS.length}</span>
                  </div>
                  <p className="text-purple-200 mb-6 leading-relaxed">
                    {correctCount === HUNT_QUESTIONS.length 
                      ? "Perfect! You're a true Verse expert. Claim your reward below!" 
                      : `Good effort! You got ${correctCount} out of ${HUNT_QUESTIONS.length} correct. Claim your score below!`}
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
                      if (!hasSaved) {
                        updateScore();
                      }
                      setIsHuntActive(false);
                    }}
                    disabled={hasSaved && isFinished}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl disabled:opacity-50"
                  >
                    {hasSaved ? 'Score Saved!' : 'Claim Your Reward & Save Score'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {isPrivacyModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0a051a]/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1a0a3e] border border-white/10 w-full max-w-2xl max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="text-xl font-bold text-white">Privacy Policy</h3>
                <button 
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="text-purple-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar text-purple-100/90 space-y-6">
                <div>
                  <h4 className="text-white font-bold text-lg mb-2">Privacy Policy for Verse Scavenger Hunt</h4>
                  <p className="text-sm text-purple-300">Effective Date: 10 Apr 2026</p>
                </div>

                <p className="text-sm leading-relaxed">
                  Welcome to the Verse Scavenger Hunt. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you participate in our scavenger hunt activities.
                </p>

                <section>
                  <h5 className="text-white font-bold mb-2">1. Information We Collect</h5>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li><strong>Personal Information:</strong> Username, email address, or social media handle (if required for participation)</li>
                    <li><strong>Activity Data:</strong> Participation actions such as submissions, completed tasks, and engagement metrics</li>
                    <li><strong>Technical Data:</strong> IP address, device type, browser information (for security and analytics purposes)</li>
                  </ul>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">2. How We Use Your Information</h5>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Manage and operate the scavenger hunt</li>
                    <li>Track participation and determine winners</li>
                    <li>Communicate updates, announcements, or rewards</li>
                    <li>Improve user experience and event performance</li>
                    <li>Prevent fraud and ensure fair participation</li>
                  </ul>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">3. Sharing of Information</h5>
                  <p className="text-sm">We do not sell or rent your personal information. However, we may share information:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                    <li>With trusted partners for event operations (if necessary)</li>
                    <li>To comply with legal obligations</li>
                    <li>To protect against fraudulent or abusive activity</li>
                  </ul>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">4. Data Security</h5>
                  <p className="text-sm">We take reasonable measures to protect your information from unauthorized access, misuse, or disclosure. However, no system is 100% secure.</p>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">5. Cookies & Tracking</h5>
                  <p className="text-sm">We may use cookies or similar technologies to enhance your experience, analyze traffic, and improve functionality.</p>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">6. Your Rights</h5>
                  <p className="text-sm">You have the right to:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                    <li>Request access to your data</li>
                    <li>Request correction or deletion of your data</li>
                    <li>Withdraw consent at any time</li>
                  </ul>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">7. Third-Party Links</h5>
                  <p className="text-sm">The scavenger hunt may include links to third-party platforms (e.g., social media). We are not responsible for their privacy practices.</p>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">8. Children’s Privacy</h5>
                  <p className="text-sm">This event is not intended for children under 13. We do not knowingly collect data from children.</p>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">9. Changes to This Policy</h5>
                  <p className="text-sm">We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.</p>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">10. Contact Us</h5>
                  <p className="text-sm">If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
                  <p className="text-purple-400 font-bold mt-1">Email: joel@bitcoin.com</p>
                </section>

                <p className="text-xs text-purple-400/60 pt-4 italic">
                  By participating in the Verse Scavenger Hunt, you agree to this Privacy Policy.
                </p>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                <button 
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-2.5 rounded-xl font-bold transition-colors shadow-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 bg-[#1a0a3e]/80 backdrop-blur-md border-t border-white/10 py-12 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <img 
              src="https://i.ibb.co/DHd07RDx/logo.png" 
              alt="Verse Logo" 
              className="w-8 h-8 rounded-lg object-cover opacity-80"
              referrerPolicy="no-referrer"
            />
            <span className="text-xl font-bold text-white/90">verse</span>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            <button 
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-purple-300/70 hover:text-white text-sm font-medium transition-colors"
            >
              Privacy Policy
            </button>
            <a href="#" className="text-purple-300/70 hover:text-white text-sm font-medium transition-colors">Terms of Service</a>
            <button 
              onClick={() => setIsContactModalOpen(true)}
              className="text-purple-300/70 hover:text-white text-sm font-medium transition-colors"
            >
              Contact Us
            </button>
            <a href="#" className="text-purple-300/70 hover:text-white text-sm font-medium transition-colors">Documentation</a>
            <a href="#" className="text-purple-300/70 hover:text-white text-sm font-medium transition-colors">Community</a>
          </div>

          <p className="text-purple-300/40 text-xs font-medium">
            &copy; 2026 Verse. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Contact Us Modal */}
      <AnimatePresence>
        {isContactModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0a051a]/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1a0a3e] border border-white/10 w-full max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="text-xl font-bold text-white">Contact Us</h3>
                <button 
                  onClick={() => setIsContactModalOpen(false)}
                  className="text-purple-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar text-purple-100/90 space-y-8">
                <div className="text-center">
                  <h4 className="text-2xl font-black text-white mb-3">Get in Touch</h4>
                  <p className="text-purple-300 leading-relaxed">
                    We'd love to hear from you! Whether you have questions, feedback, or need support regarding the Verse Scavenger Hunt, feel free to reach out.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General Inquiries */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                        <Mail size={20} />
                      </div>
                      <h5 className="text-white font-bold">General Inquiries</h5>
                    </div>
                    <p className="text-xs text-purple-300 mb-3">For event rules or participation questions.</p>
                    <a href="mailto:joel@bitcoin.com" className="text-purple-400 font-bold hover:underline text-sm">joel@bitcoin.com</a>
                  </div>

                  {/* Support */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-400">
                        <Gift size={20} />
                      </div>
                      <h5 className="text-white font-bold">Support</h5>
                    </div>
                    <p className="text-xs text-purple-300 mb-3">Facing technical issues or submission errors?</p>
                    <a href="mailto:joel@bitcoin.com" className="text-purple-400 font-bold hover:underline text-sm">joel@bitcoin.com</a>
                  </div>

                  {/* Partnerships */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400">
                        <Sparkles size={20} />
                      </div>
                      <h5 className="text-white font-bold">Partnerships</h5>
                    </div>
                    <p className="text-xs text-purple-300 mb-3">Interested in collaborating with Verse?</p>
                    <a href="mailto:joel@bitcoin.com" className="text-purple-400 font-bold hover:underline text-sm">joel@bitcoin.com</a>
                  </div>

                  {/* Response Time */}
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
                        <Clock size={20} />
                      </div>
                      <h5 className="text-white font-bold">Response Time</h5>
                    </div>
                    <p className="text-xs text-purple-300 leading-relaxed">
                      We usually respond within 24–48 hours. During high activity, it may take longer.
                    </p>
                  </div>
                </div>

                {/* Social Media Section */}
                <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 p-8 rounded-3xl text-center">
                  <h5 className="text-white font-bold mb-6 flex items-center justify-center gap-2">
                    <MessageCircle size={20} className="text-purple-400" />
                    Connect on Social Media
                  </h5>
                  <div className="flex flex-wrap justify-center gap-4">
                    <a 
                      href="https://x.com/VerseEcosystem" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-black/40 hover:bg-black/60 text-white px-6 py-3 rounded-2xl border border-white/10 transition-all hover:scale-105"
                    >
                      <Twitter size={20} />
                      <span className="font-bold">Twitter / X</span>
                    </a>
                    <a 
                      href="https://t.me/GetVerse" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-white px-6 py-3 rounded-2xl border border-[#229ED9]/30 transition-all hover:scale-105"
                    >
                      <Send size={20} />
                      <span className="font-bold">Telegram</span>
                    </a>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3">
                  <ShieldAlert size={20} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-200/80 leading-relaxed">
                    <strong>Important Note:</strong> Please avoid sharing sensitive personal information (passwords, private keys, etc.) when contacting us.
                  </p>
                </div>

                <p className="text-center text-purple-400 font-bold text-lg pt-4">
                  Thank you for being part of the Verse Scavenger Hunt 🚀
                </p>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                <button 
                  onClick={() => setIsContactModalOpen(false)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-2.5 rounded-xl font-bold transition-colors shadow-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
