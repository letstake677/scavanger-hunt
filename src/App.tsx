/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Menu, X, Trophy, MapPin, Search, Gift, Lightbulb, CheckCircle2, ArrowRight, Sparkles, User, Mail, MessageCircle, Twitter, Send, ExternalLink, ShieldAlert, Clock, Edit2, Wallet, Medal, Crown, Volume2, VolumeX, Zap, Award, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAccount, useDisconnect, useBalance } from 'wagmi'
import { modal } from './config/reown'
import { formatEther } from 'viem'
import confetti from 'canvas-confetti';

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
    options: ["April 12", "April 15", "April 17, 00:00 UTC", "April 20"],
    answer: "April 17, 00:00 UTC",
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
  const [isMissionFailed, setIsMissionFailed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [hasCompleted, setHasCompleted] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newProfilePic, setNewProfilePic] = useState('');
  const [newAvatarGender, setNewAvatarGender] = useState<'male' | 'female'>('male');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');

  const getBadge = (score: number) => {
    if (score >= 1000) return { icon: <Crown size={14} />, label: 'Master', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' };
    if (score >= 500) return { icon: <Zap size={14} />, label: 'Elite', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' };
    if (score >= 250) return { icon: <Star size={14} />, label: 'Tracker', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
    return { icon: <Medal size={14} />, label: 'Novice', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' };
  };

  const playSound = (soundUrl: string) => {
    if (isMuted) return;
    const audio = new Audio(soundUrl);
    audio.volume = 0.4;
    audio.play().catch(e => console.log('Audio play blocked by browser:', e));
  };

  // Countdown Timer Logic
  useEffect(() => {
    const targetDate = new Date('2026-04-17T00:00:00Z').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
        if (data.username) {
          setUsername(data.username);
          setNewUsername(data.username);
        }
        if (data.score !== undefined) setUserScore(data.score);
        if (data.avatarGender) {
          setAvatarGender(data.avatarGender);
          setNewAvatarGender(data.avatarGender);
        }
        if (data.profilePic) {
          setNewProfilePic(data.profilePic);
        }
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
    if (!address || hasSaved || isMissionFailed) return;
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
      if (data.score !== undefined) setUserScore(data.score);
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

  const updateProfile = async () => {
    if (!address || !newUsername.trim()) return;
    
    setIsUpdatingProfile(true);
    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          username: newUsername.trim(),
          profilePic: newProfilePic.trim(),
          avatarGender: newAvatarGender
        })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsername(updatedUser.username);
        if (updatedUser.avatarGender) {
          setAvatarGender(updatedUser.avatarGender);
          setNewAvatarGender(updatedUser.avatarGender);
        }
        setIsProfileModalOpen(false);
        playSound(SOUNDS.success);
        fetchLeaderboard();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const startHunt = () => {
    if (!username || username.trim() === '') {
      setNewUsername('');
      setIsProfileModalOpen(true);
      setStatusMessage({ type: 'error', text: 'Please set a username in your profile before starting the hunt!' });
      return;
    }
    setIsHuntActive(true);
    setCurrentStep(0);
    setCorrectCount(0);
    setSelectedOption(null);
    setShowHint(false);
    setIsFinished(false);
    setIsMissionFailed(false);
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
      
      // Move to next question after a short delay
      setTimeout(() => {
        if (currentStep < HUNT_QUESTIONS.length - 1) {
          setCurrentStep(prev => prev + 1);
          setSelectedOption(null);
          setShowHint(false);
          setIsCorrect(null);
        } else {
          setIsFinished(true);
          if (correctCount + 1 === HUNT_QUESTIONS.length) {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#a855f7', '#ec4899', '#f97316']
            });
          }
        }
      }, 1000);
    } else {
      playSound(SOUNDS.incorrect);
      // Mission Failed immediately on wrong answer
      setTimeout(() => {
        setIsMissionFailed(true);
        setIsFinished(true);
      }, 1000);
    }
  };

  const getAvatarUrl = (user: any) => {
    if (user && user.profilePic) return user.profilePic;
    const username = user?.username || 'Hunter';
    const gender = user?.avatarGender || 'male';
    
    if (gender === 'male') {
      // User requested specific male avatar image
      return 'https://i.ibb.co/Tqx0y7W5/avatar.png'; // Attempting direct link format
    }
    
    // Using valid Dicebear Avataaars topType identifiers for female
    const topType = 'longHairBigHair,longHairBob,longHairBun,longHairCurly,longHairCurvy,longHairDreads,longHairFrida,longHairFro,longHairFroBand,longHairNotTooLong,longHairShavedSides,longHairMiaWallace,longHairStraight,longHairStraight2,longHairStraightStrand';
    
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&topType=${topType}&facialHairProbability=0`;
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

          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 text-purple-300 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/10"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col items-end mr-2">
                  <span className="text-white text-xs font-bold">{username || address?.slice(0, 6) + '...' + address?.slice(-4)}</span>
                  {balance && (
                    <span className="text-purple-300 text-[10px] font-mono">
                      {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <button 
                    onClick={() => {
                      setNewUsername(username);
                      setNewProfilePic(leaderboard.find(p => p.address.toLowerCase() === address?.toLowerCase())?.profilePic || '');
                      setIsProfileModalOpen(true);
                    }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center border border-white/20 overflow-hidden hover:scale-110 transition-transform"
                  >
                    {leaderboard.find(p => p.address.toLowerCase() === address?.toLowerCase())?.profilePic ? (
                      <img 
                        src={leaderboard.find(p => p.address.toLowerCase() === address?.toLowerCase())?.profilePic} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={18} className="text-white" />
                    )}
                  </button>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#1a0a3e] rounded-full"></div>
                </div>
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
                    <div className="relative group">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center border-2 border-purple-400/30 overflow-hidden">
                        {leaderboard.find(p => p.address.toLowerCase() === address?.toLowerCase())?.profilePic ? (
                          <img 
                            src={leaderboard.find(p => p.address.toLowerCase() === address?.toLowerCase())?.profilePic} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          setNewUsername(username);
                          setNewProfilePic(leaderboard.find(p => p.address.toLowerCase() === address?.toLowerCase())?.profilePic || '');
                          setIsProfileModalOpen(true);
                        }}
                        className="absolute -bottom-1 -right-1 p-1 bg-purple-600 rounded-full border border-purple-400 text-white shadow-lg"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{username || address?.slice(0, 6) + '...' + address?.slice(-4)}</p>
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
      <section className="relative min-h-[70vh] md:min-h-0 flex flex-col items-center justify-start text-center px-5 pt-20 md:pt-24 pb-8 md:pb-0 overflow-hidden">
        {/* Floating Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[10%] md:left-[15%] text-purple-400/30"
          >
            <MapPin size={64} />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 20, 0], rotate: [0, -15, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] right-[10%] md:right-[15%] text-pink-400/30"
          >
            <Trophy size={80} />
          </motion.div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[30%] left-[5%] text-yellow-400/20"
          >
            <Sparkles size={100} />
          </motion.div>
          <motion.div 
            animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[40%] right-[5%] text-cyan-400/20"
          >
            <Gift size={70} />
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-white text-xs font-bold tracking-wider uppercase">Live: Season 1 Now Active</span>
          </motion.div>

          {/* Countdown Timer */}
          <div className="flex justify-center gap-4 mb-10">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Mins', value: timeLeft.minutes },
              { label: 'Secs', value: timeLeft.seconds },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl">
                  <span className="text-2xl md:text-3xl font-black text-white">{item.value.toString().padStart(2, '0')}</span>
                </div>
                <span className="text-[10px] md:text-xs font-bold text-purple-300 uppercase tracking-widest mt-2">{item.label}</span>
              </div>
            ))}
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] mb-6 drop-shadow-2xl">
            Join the <span className="bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent">Ultimate</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">Scavenger Hunt!</span>
          </h1>
          
          <p className="text-purple-100 text-xl md:text-2xl mb-10 drop-shadow-md max-w-2xl mx-auto font-medium leading-relaxed">
            Explore your city, solve mind-bending clues, and <span className="text-yellow-400 font-bold">win massive prizes</span> in the most exciting web3 adventure!
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-5 mb-16">
            <button 
              onClick={() => {
                if (!isConnected) {
                  modal.open();
                } else {
                  startHunt();
                }
              }}
              className="group relative bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-12 py-5 rounded-2xl text-xl font-black hover:scale-105 transition-all shadow-[0_10px_40px_rgba(168,85,247,0.4)] flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
              {isConnected ? (hasCompleted ? 'Play Again' : 'Start Hunting') : 'Connect Wallet'}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <a 
              href="#how"
              className="text-white font-bold hover:text-purple-300 transition-colors flex items-center gap-2 px-6 py-3"
            >
              <Search size={20} />
              How it works
            </a>
          </div>

          {/* Live Activity Ticker */}
          <div className="max-w-md mx-auto mb-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-full py-2 px-4 overflow-hidden relative">
            <div className="flex items-center gap-2 whitespace-nowrap animate-marquee">
              <Zap size={14} className="text-yellow-400 shrink-0" />
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">Recent Activity:</span>
              {leaderboard.length > 0 ? (
                leaderboard.slice(0, 5).map((player, i) => (
                  <span key={i} className="text-xs text-white font-medium ml-4">
                    {player.username} just earned {player.score} points! •
                  </span>
                ))
              ) : (
                <span className="text-xs text-white font-medium ml-4">Hunters are joining the Verse...</span>
              )}
            </div>
          </div>

          {/* Progress Bar in Hero */}
          {isConnected && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="max-w-2xl mx-auto bg-[#1a0a3e]/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative mb-4 md:mb-0"
            >
              {/* Lion Background Decoration */}
              <div className="absolute top-[-10px] right-[-10px] opacity-10 rotate-12 pointer-events-none">
                <span className="text-6xl">🦁</span>
              </div>

              <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
                <div className="text-left">
                  <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                    Hunter Progress <span className="text-yellow-400 animate-bounce">🦁</span>
                  </h2>
                  <p className="text-purple-300 text-[10px] md:text-xs font-medium">
                    Earn <span className="text-white font-bold">1,000 points</span> for 5 Scratchers!
                  </p>
                </div>
                <div className="bg-purple-500/20 border border-purple-500/30 px-4 py-1.5 rounded-xl">
                  <span className="text-lg font-black text-purple-300">
                    {Math.min(userScore, 1000).toLocaleString()} / 1,000
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((userScore / 1000) * 100, 100)}%` }}
                  transition={{ duration: 2, ease: "circOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 relative shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                </motion.div>
              </div>

              {/* Reward Message */}
              <AnimatePresence>
                {userScore >= 1000 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 bg-yellow-400/10 border border-yellow-400/30 p-3 rounded-xl text-center relative z-10"
                  >
                    <p className="text-yellow-400 font-bold text-xs">
                      5 scratchers won! Wait, JT is sending your reward. Keep patience! 🦁
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Rewards Wallet Section */}
      <section className="relative z-10 px-5 py-8 md:py-0 text-center md:-mt-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-gradient-to-br from-indigo-900/95 to-purple-900/95 backdrop-blur-2xl rounded-[2.5rem] border-2 border-indigo-500/40 p-8 md:p-24 shadow-[0_40px_100px_rgba(0,0,0,0.7)] relative overflow-hidden"
        >
          {/* Decorative Background Icon */}
          <div className="absolute top-[-60px] left-[-60px] opacity-10 rotate-[-12deg] pointer-events-none">
            <Wallet size={320} className="text-indigo-400" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 bg-indigo-500/30 border border-indigo-500/50 px-8 py-2.5 rounded-full mb-10">
              <Wallet className="text-indigo-400 w-6 h-6" />
              <span className="text-indigo-100 text-base font-black tracking-[0.2em] uppercase">Rewards Setup Guide</span>
            </div>

            <h2 className="text-3xl md:text-6xl lg:text-7xl font-black text-white mb-10 leading-[1.1] tracking-tight">
              Don't forget to add your rewards wallet to <a href="https://hub.vgdh.io" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-8 decoration-4 transition-all hover:scale-105 inline-block">hub.vgdh.io</a>!
            </h2>
            
            <div className="bg-black/40 rounded-[2rem] p-8 md:p-16 mt-12 text-left border border-white/10 shadow-2xl">
              <h3 className="text-white font-black text-2xl md:text-4xl mb-10 flex items-center gap-4">
                <CheckCircle2 className="text-green-400 w-10 h-10" />
                Step-by-Step Instructions:
              </h3>
              <ul className="space-y-8 md:space-y-12">
                {[
                  { step: 1, text: <>Visit the official hub: <a href="https://hub.vgdh.io" target="_blank" rel="noopener noreferrer" className="text-indigo-400 font-black hover:underline decoration-4">hub.vgdh.io</a></> },
                  { step: 2, text: "Sign in securely with your Email, GitHub, or Discord account" },
                  { step: 3, text: "Navigate to the /rewards section in your dashboard" },
                  { step: 4, text: "Connect your Polygon rewards wallet and sign the transaction to confirm" }
                ].map((item) => (
                  <li key={item.step} className="flex items-start gap-8 group">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1.25rem] bg-indigo-500/30 border-2 border-indigo-500/50 text-indigo-200 text-xl md:text-3xl font-black flex items-center justify-center shrink-0 mt-1 group-hover:bg-indigo-500 group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-2xl">
                      {item.step}
                    </div>
                    <p className="text-white text-xl md:text-3xl font-extrabold leading-tight group-hover:text-indigo-200 transition-colors">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-16 text-indigo-200 text-lg md:text-xl font-bold italic bg-indigo-500/10 inline-block px-10 py-4 rounded-full border border-indigo-500/20 shadow-lg">
              * Ensure you use the same wallet address to sync your hunt progress and rewards.
            </p>
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="relative z-10 px-5 py-12 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-12 text-white drop-shadow-md">
          How It <span className="text-purple-400">Works</span>
        </h2>
        <div className="flex justify-center gap-8 flex-wrap max-w-6xl mx-auto">
          
          {/* Card 1 */}
          <div className="bg-[#1a0a3e]/95 backdrop-blur-md rounded-2xl w-72 shadow-[0_15px_40px_rgba(0,0,0,0.4)] overflow-hidden hover:-translate-y-2 transition-all duration-300 border border-white/20 text-left flex flex-col group">
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
          <div className="bg-[#1a0a3e]/95 backdrop-blur-md rounded-2xl w-72 shadow-[0_15px_40px_rgba(0,0,0,0.4)] overflow-hidden hover:-translate-y-2 transition-all duration-300 border border-white/20 text-left flex flex-col group">
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
          <div className="bg-[#1a0a3e]/95 backdrop-blur-md rounded-2xl w-72 shadow-[0_15px_40px_rgba(0,0,0,0.4)] overflow-hidden hover:-translate-y-2 transition-all duration-300 border border-white/20 text-left flex flex-col group">
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
      <section id="leaderboard" className="relative z-10 px-5 py-24 text-center">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 px-4 py-1.5 rounded-full mb-4">
              <Trophy className="text-yellow-400 w-4 h-4" />
              <span className="text-yellow-400 text-xs font-black tracking-widest uppercase">Global Standings</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Hunters</span>
            </h2>
            <p className="text-purple-300 max-w-xl text-lg font-medium">
              The elite explorers of the Verse ecosystem. Will you be the next to claim the crown?
            </p>
          </motion.div>
          
          {/* Podium for Top 3 */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
              {/* 2nd Place */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="order-2 md:order-1 bg-[#1a0a3e]/80 backdrop-blur-xl border border-slate-400/30 p-8 rounded-[2rem] shadow-2xl relative group hover:-translate-y-2 transition-all duration-500"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-400 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/50 rotate-12 group-hover:rotate-0 transition-transform z-20">
                  <Medal className="text-slate-900 w-6 h-6" />
                </div>
                <div className="relative z-10">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden border-4 border-slate-400/20 shadow-inner bg-slate-400/10">
                    <img 
                      key={`${leaderboard[1].address}-${leaderboard[1].avatarGender}`}
                      src={getAvatarUrl(leaderboard[1])} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      onError={(e) => (e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[1].username}&topType=shortHairTheCaesar`)}
                    />
                  </div>
                  <h3 className="text-xl font-black text-white mb-1 truncate">{leaderboard[1].username}</h3>
                  <div className="flex justify-center mb-3">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${getBadge(leaderboard[1].score).bg} ${getBadge(leaderboard[1].score).border} ${getBadge(leaderboard[1].score).color}`}>
                      {getBadge(leaderboard[1].score).icon}
                      <span className="text-[10px] font-black uppercase tracking-widest">{getBadge(leaderboard[1].score).label}</span>
                    </div>
                  </div>
                  <div className="text-slate-400 font-mono text-2xl font-black">{leaderboard[1].score.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Points</div>
                </div>
              </motion.div>

              {/* 1st Place */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="order-1 md:order-2 bg-gradient-to-b from-yellow-400/20 to-[#1a0a3e]/90 backdrop-blur-xl border-2 border-yellow-400/50 p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(250,204,21,0.2)] relative group hover:-translate-y-4 transition-all duration-500 z-10"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-yellow-400 rounded-3xl flex items-center justify-center shadow-xl shadow-yellow-900/50 -rotate-12 group-hover:rotate-0 transition-transform z-20">
                  <Crown className="text-yellow-900 w-8 h-8" />
                </div>
                <div className="relative z-10">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-[2rem] overflow-hidden border-4 border-yellow-400/40 shadow-2xl bg-yellow-400/10">
                    <img 
                      key={`${leaderboard[0].address}-${leaderboard[0].avatarGender}`}
                      src={getAvatarUrl(leaderboard[0])} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      onError={(e) => (e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[0].username}&topType=shortHairTheCaesar`)}
                    />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-1 truncate">{leaderboard[0].username}</h3>
                  <div className="flex justify-center mb-4">
                    <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border ${getBadge(leaderboard[0].score).bg} ${getBadge(leaderboard[0].score).border} ${getBadge(leaderboard[0].score).color} shadow-[0_0_15px_rgba(250,204,21,0.3)]`}>
                      {getBadge(leaderboard[0].score).icon}
                      <span className="text-xs font-black uppercase tracking-widest">{getBadge(leaderboard[0].score).label}</span>
                    </div>
                  </div>
                  <div className="text-yellow-400 font-mono text-4xl font-black">{leaderboard[0].score.toLocaleString()}</div>
                  <div className="text-xs text-yellow-500/60 uppercase font-black tracking-[0.2em] mt-2">Supreme Hunter</div>
                </div>
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-yellow-400/5 blur-3xl rounded-full -z-10 group-hover:bg-yellow-400/10 transition-colors" />
              </motion.div>

              {/* 3rd Place */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="order-3 bg-[#1a0a3e]/80 backdrop-blur-xl border border-amber-700/30 p-8 rounded-[2rem] shadow-2xl relative group hover:-translate-y-2 transition-all duration-500"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-amber-700 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/50 -rotate-6 group-hover:rotate-0 transition-transform z-20">
                  <Medal className="text-amber-100 w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-3xl overflow-hidden border-4 border-amber-700/20 shadow-inner bg-amber-700/10">
                    <img 
                      key={`${leaderboard[2].address}-${leaderboard[2].avatarGender}`}
                      src={getAvatarUrl(leaderboard[2])} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      onError={(e) => (e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[2].username}&topType=shortHairTheCaesar`)}
                    />
                  </div>
                  <h3 className="text-xl font-black text-white mb-1 truncate">{leaderboard[2].username}</h3>
                  <div className="flex justify-center mb-3">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${getBadge(leaderboard[2].score).bg} ${getBadge(leaderboard[2].score).border} ${getBadge(leaderboard[2].score).color}`}>
                      {getBadge(leaderboard[2].score).icon}
                      <span className="text-[10px] font-black uppercase tracking-widest">{getBadge(leaderboard[2].score).label}</span>
                    </div>
                  </div>
                  <div className="text-amber-600 font-mono text-2xl font-black">{leaderboard[2].score.toLocaleString()}</div>
                  <div className="text-[10px] text-amber-700 uppercase font-black tracking-widest mt-1">Points</div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Rest of the Leaderboard */}
          <div className="bg-[#1a0a3e]/90 backdrop-blur-2xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
            <div className="grid grid-cols-[60px_1fr_120px] px-8 py-4 border-b border-white/5 bg-white/5 text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">
              <span>Rank</span>
              <span className="text-left">Hunter</span>
              <span className="text-right">Score</span>
            </div>
            
            <div className="divide-y divide-white/5">
              {leaderboard.length > 0 ? (
                leaderboard.slice(leaderboard.length >= 3 ? 3 : 0).map((user, index) => {
                  const actualRank = (leaderboard.length >= 3 ? 3 : 0) + index + 1;
                  const isCurrentUser = address && user.address.toLowerCase() === address.toLowerCase();
                  return (
                    <motion.div 
                      key={user.address} 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className={`grid grid-cols-[60px_1fr_120px] items-center px-8 py-5 transition-colors group cursor-default ${
                        isCurrentUser ? 'bg-purple-500/20 border-y border-purple-500/30' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="font-mono text-lg font-black text-purple-500/50 group-hover:text-purple-400 transition-colors">
                        #{actualRank.toString().padStart(2, '0')}
                      </div>
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 overflow-hidden shrink-0">
                          <img 
                            key={`${user.address}-${user.avatarGender}`}
                            src={getAvatarUrl(user)} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={(e) => (e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}&topType=shortHairTheCaesar`)}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-lg group-hover:translate-x-1 transition-transform">{user.username}</span>
                          <div className={`flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md border w-fit ${getBadge(user.score).bg} ${getBadge(user.score).border} ${getBadge(user.score).color}`}>
                            {getBadge(user.score).icon}
                            <span className="text-[8px] font-black uppercase tracking-widest">{getBadge(user.score).label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono text-xl font-black">{user.score.toLocaleString()}</div>
                        <div className="text-[8px] text-purple-500 uppercase font-black tracking-widest">Points</div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="py-20 text-purple-300 italic flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Search className="text-purple-500/40" />
                  </div>
                  No hunters found in the wild yet.
                </div>
              )}
            </div>
            
            <div className="p-8 bg-white/5 border-t border-white/5">
              <button className="group flex items-center gap-2 mx-auto text-purple-300 hover:text-white font-black text-sm uppercase tracking-widest transition-all">
                View Full Leaderboard
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
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
              ) : isMissionFailed ? (
                <div className="p-12 text-center relative overflow-hidden">
                  <div className="w-20 h-20 bg-red-500/20 border-2 border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/20 relative z-10">
                    <ShieldAlert size={40} className="text-red-500" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2 relative z-10">Mission Failed! 🦁</h3>
                  <p className="text-purple-200 mb-8 leading-relaxed relative z-10">
                    One wrong move and the hunt is over. Our beloved JT doesn't like mistakes! Try again to claim your rewards.
                  </p>
                  
                  <button 
                    onClick={startHunt}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-600 text-white py-4 rounded-2xl font-bold shadow-xl relative z-10 hover:scale-[1.02] transition-transform"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="p-12 text-center relative overflow-hidden">
                  {/* Lion Background */}
                  <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                    <span className="text-9xl">🦁</span>
                  </div>

                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/20 relative z-10">
                    <Trophy size={40} className="text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2 relative z-10">Hunt Completed! 🦁</h3>
                  <div className="inline-block bg-purple-500/20 border border-purple-500/30 px-6 py-2 rounded-full mb-6 relative z-10">
                    <span className="text-2xl font-black text-purple-400">Result: {correctCount} / {HUNT_QUESTIONS.length}</span>
                  </div>
                  <p className="text-purple-200 mb-8 leading-relaxed relative z-10">
                    Perfect! You're a true Verse expert. Claim your reward below!
                  </p>
                  
                  <button 
                    onClick={() => {
                      if (!hasSaved) {
                        updateScore();
                      }
                      setIsHuntActive(false);
                    }}
                    disabled={hasSaved && isFinished}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl disabled:opacity-50 relative z-10"
                  >
                    {hasSaved ? 'Score Saved!' : 'Claim Your Reward & Save Score'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Edit Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500" />
              
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <User className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">{username ? 'Edit Profile' : 'Set Your Hunter Name'}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-1">Username</label>
                  <input 
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                    className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-300 mb-1">Profile Picture URL</label>
                  <input 
                    type="text"
                    value={newProfilePic}
                    onChange={(e) => setNewProfilePic(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Provide a direct link to an image (ImgBB, etc.)</p>
                </div>

                {!newProfilePic && (
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">Avatar Style</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setNewAvatarGender('male')}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                          newAvatarGender === 'male' 
                            ? 'bg-blue-500/20 border-blue-500 text-white' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <User size={16} className="text-blue-400" /> Male
                      </button>
                      <button
                        onClick={() => setNewAvatarGender('female')}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                          newAvatarGender === 'female' 
                            ? 'bg-pink-500/20 border-pink-500 text-white' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <User size={16} className="text-pink-400" /> Female
                      </button>
                    </div>
                  </div>
                )}

                {(newProfilePic || !newProfilePic) && (
                  <div className="flex justify-center py-2">
                    <div className="w-20 h-20 rounded-full border-2 border-purple-500/50 overflow-hidden bg-gray-800">
                      <img 
                        src={newProfilePic || getAvatarUrl({ username: newUsername || username, avatarGender: newAvatarGender })} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Invalid+URL')}
                      />
                    </div>
                  </div>
                )}

                {/* Badges Section */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Award size={14} /> Your Badges
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {userScore >= 0 && (
                      <div className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center border border-slate-600 group-hover:border-slate-400 transition-colors">
                          <Medal size={20} className="text-slate-400" />
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">Novice</span>
                      </div>
                    )}
                    {userScore >= 250 && (
                      <div className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50 group-hover:border-blue-400 transition-colors">
                          <Star size={20} className="text-blue-400" />
                        </div>
                        <span className="text-[10px] text-blue-400 font-bold">Tracker</span>
                      </div>
                    )}
                    {userScore >= 500 && (
                      <div className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/50 group-hover:border-purple-400 transition-colors">
                          <Zap size={20} className="text-purple-400" />
                        </div>
                        <span className="text-[10px] text-purple-400 font-bold">Elite</span>
                      </div>
                    )}
                    {userScore >= 1000 && (
                      <div className="flex flex-col items-center gap-1 group">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/50 group-hover:border-yellow-400 transition-colors">
                          <Crown size={20} className="text-yellow-400" />
                        </div>
                        <span className="text-[10px] text-yellow-400 font-bold">Master</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={updateProfile}
                  disabled={isUpdatingProfile || !newUsername.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdatingProfile ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
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

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {isTermsModalOpen && (
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
                <h3 className="text-xl font-bold text-white">Terms of Service</h3>
                <button 
                  onClick={() => setIsTermsModalOpen(false)}
                  className="text-purple-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar text-purple-100/90 space-y-6">
                <div>
                  <h4 className="text-white font-bold text-lg mb-2">Terms of Service – Verse Scavenger Hunt</h4>
                  <p className="text-sm text-purple-300">Effective Date: 10 Apr 2026</p>
                </div>

                <p className="text-sm leading-relaxed">
                  Welcome to the Verse Scavenger Hunt. By participating in this event, you agree to the following Terms of Service. Please read them carefully.
                </p>

                <section>
                  <h5 className="text-white font-bold mb-2">1. Eligibility</h5>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Participants must be at least 13 years old</li>
                    <li>Participants must comply with all local laws and regulations</li>
                    <li>Only one account per user is allowed (no duplicate or fake accounts)</li>
                  </ul>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">2. Participation Rules</h5>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>All tasks must be completed honestly and fairly</li>
                    <li>Any form of cheating, bot usage, or manipulation will result in disqualification</li>
                    <li>Submitted content must be original and not infringe on any copyrights</li>
                  </ul>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">3. Rewards & Prizes</h5>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Rewards will be distributed based on performance, engagement, and quality</li>
                    <li>The organizers reserve the right to verify entries before awarding prizes</li>
                    <li>Any fraudulent activity will result in forfeiture of rewards</li>
                  </ul>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">4. User Conduct</h5>
                  <p className="text-sm">By participating, you agree not to:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                    <li>Post harmful, abusive, or offensive content</li>
                    <li>Engage in spam or misleading activities</li>
                    <li>Violate any laws or platform guidelines</li>
                  </ul>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">5. Intellectual Property</h5>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Participants retain ownership of their content</li>
                    <li>By submitting content, you grant us permission to use, share, and promote it for marketing and promotional purposes</li>
                  </ul>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">6. Limitation of Liability</h5>
                  <p className="text-sm">
                    We are not responsible for any losses, damages, or issues arising from participation. Participation is at your own risk.
                  </p>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">7. Termination</h5>
                  <p className="text-sm">We reserve the right to:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                    <li>Disqualify any participant who violates these terms</li>
                    <li>Modify or cancel the event at any time without prior notice</li>
                  </ul>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">8. Changes to Terms</h5>
                  <p className="text-sm">
                    We may update these Terms of Service at any time. Continued participation means you accept the updated terms.
                  </p>
                </section>

                <section>
                  <h5 className="text-white font-bold mb-2">9. Contact</h5>
                  <p className="text-sm">If you have any questions regarding these Terms:</p>
                  <p className="text-purple-400 font-bold mt-1">Email: joel@bitcoin.com</p>
                </section>

                <p className="text-xs text-purple-400/60 pt-4 italic">
                  By participating in the Verse Scavenger Hunt, you agree to these Terms of Service.
                </p>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                <button 
                  onClick={() => setIsTermsModalOpen(false)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-2.5 rounded-xl font-bold transition-colors shadow-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documentation Modal */}
      <AnimatePresence>
        {isDocsModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0a051a]/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1a0a3e] border border-white/10 w-full max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="text-xl font-bold text-white">Documentation</h3>
                <button 
                  onClick={() => setIsDocsModalOpen(false)}
                  className="text-purple-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar text-purple-100/90 space-y-8">
                <div>
                  <h4 className="text-2xl font-black text-white mb-3">Verse Scavenger Hunt – Documentation</h4>
                  <p className="text-sm text-purple-300">Official Guide & Resources</p>
                </div>

                <p className="text-sm leading-relaxed">
                  Welcome to the official documentation for the Verse Scavenger Hunt. This guide will help you understand how the event works, how to participate, and how to maximize your chances of winning.
                </p>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-lg">
                    <ArrowRight className="text-purple-400" size={20} />
                    <h5>🚀 Overview</h5>
                  </div>
                  <p className="text-sm pl-8">The Verse Scavenger Hunt is an interactive community event designed to increase engagement, educate users about the ecosystem, and reward active participants.</p>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-lg">
                    <MapPin className="text-purple-400" size={20} />
                    <h5>🎯 How It Works</h5>
                  </div>
                  <ol className="list-decimal pl-12 space-y-2 text-sm">
                    <li>Join the event via official announcement</li>
                    <li>Receive a list of tasks or missions</li>
                    <li>Complete tasks on different platforms (Twitter/X, Telegram, etc.)</li>
                    <li>Submit proof of completion</li>
                    <li>Earn points based on engagement and quality</li>
                  </ol>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-lg">
                    <Search className="text-purple-400" size={20} />
                    <h5>🧩 Types of Tasks</h5>
                  </div>
                  <ul className="list-disc pl-12 space-y-2 text-sm">
                    <li>Posting memes or content</li>
                    <li>Sharing educational posts</li>
                    <li>Creating videos or reels</li>
                    <li>Engaging with community posts</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-lg">
                    <Trophy className="text-purple-400" size={20} />
                    <h5>📊 Scoring System</h5>
                  </div>
                  <p className="text-sm pl-8 mb-2">Your performance is evaluated based on:</p>
                  <ul className="list-disc pl-12 space-y-2 text-sm">
                    <li>Engagement (likes, shares, comments, views)</li>
                    <li>Content quality and creativity</li>
                    <li>Consistency and participation frequency</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-lg">
                    <Gift className="text-purple-400" size={20} />
                    <h5>🏆 Rewards</h5>
                  </div>
                  <ul className="list-disc pl-12 space-y-2 text-sm">
                    <li>Weekly or monthly winners</li>
                    <li>Special bonuses for top performers</li>
                    <li>Possible exclusive rewards for high-quality content</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-lg">
                    <ShieldAlert className="text-purple-400" size={20} />
                    <h5>⚠️ Rules & Guidelines</h5>
                  </div>
                  <ul className="list-disc pl-12 space-y-2 text-sm">
                    <li>No fake engagement (bots, fake accounts)</li>
                    <li>No plagiarism or copied content</li>
                    <li>Follow platform rules and community guidelines</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-lg">
                    <CheckCircle2 className="text-purple-400" size={20} />
                    <h5>🔐 Submission Process</h5>
                  </div>
                  <ul className="list-disc pl-12 space-y-2 text-sm">
                    <li>Submit your work through the official form or platform</li>
                    <li>Ensure links are correct and accessible</li>
                    <li>Late or incomplete submissions may not be considered</li>
                  </ul>
                </section>

                <section className="bg-white/5 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-lg">
                    <MessageCircle className="text-purple-400" size={20} />
                    <h5>❓ FAQ</h5>
                  </div>
                  <div className="space-y-4 pl-8">
                    <div>
                      <p className="text-white font-bold text-sm">Q: Can I participate from multiple accounts?</p>
                      <p className="text-sm text-purple-300">A: No, only one account per user is allowed.</p>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Q: How are winners selected?</p>
                      <p className="text-sm text-purple-300">A: Based on engagement, quality, and overall impact.</p>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Q: When will rewards be distributed?</p>
                      <p className="text-sm text-purple-300">A: After verification, usually within a few days of event completion.</p>
                    </div>
                  </div>
                </section>

                <section className="text-center pt-6">
                  <p className="text-white font-bold mb-2">📩 Need Support?</p>
                  <a href="mailto:joel@bitcoin.com" className="text-purple-400 font-bold hover:underline">joel@bitcoin.com</a>
                </section>

                <p className="text-center text-purple-400 font-bold text-xl pt-4 italic">
                  Stay creative, stay active, and good luck in the Verse Scavenger Hunt 🚀
                </p>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                <button 
                  onClick={() => setIsDocsModalOpen(false)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-2.5 rounded-xl font-bold transition-colors shadow-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Modal */}
      <AnimatePresence>
        {isCommunityModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0a051a]/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1a0a3e] border border-white/10 w-full max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="text-xl font-bold text-white">Community</h3>
                <button 
                  onClick={() => setIsCommunityModalOpen(false)}
                  className="text-purple-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar text-purple-100/90 space-y-8">
                <div className="text-center">
                  <h4 className="text-2xl font-black text-white mb-3">Verse Scavenger Hunt – Community</h4>
                  <p className="text-purple-300 leading-relaxed">
                    Welcome to the heart of the Verse Scavenger Hunt — our community 🚀
                  </p>
                  <p className="text-sm mt-4 text-purple-200/80">
                    This is where creators, explorers, and innovators come together to share ideas, grow together, and make an impact across the Verse ecosystem.
                  </p>
                </div>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-lg">
                    <Sparkles className="text-purple-400" size={20} />
                    <h5>🌍 Our Mission</h5>
                  </div>
                  <ul className="list-disc pl-12 space-y-2 text-sm">
                    <li>Encourage creativity and originality</li>
                    <li>Promote collaboration across platforms</li>
                    <li>Grow the global Verse ecosystem</li>
                    <li>Reward active and valuable contributors</li>
                  </ul>
                </section>

                <section className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 p-8 rounded-3xl text-center">
                  <h5 className="text-white font-bold mb-6 flex items-center justify-center gap-2">
                    <User className="text-purple-400" size={20} />
                    🤝 Join the Community
                  </h5>
                  <p className="text-sm mb-6 text-purple-200">Become part of our growing network by connecting on different platforms:</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <a 
                      href="https://t.me/GetVerse" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-[#229ED9]/20 hover:bg-[#229ED9]/30 text-white px-6 py-3 rounded-2xl border border-[#229ED9]/30 transition-all hover:scale-105"
                    >
                      <Send size={20} />
                      <span className="font-bold">Telegram</span>
                    </a>
                    <a 
                      href="https://x.com/VerseEcosystem" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-black/40 hover:bg-black/60 text-white px-6 py-3 rounded-2xl border border-white/10 transition-all hover:scale-105"
                    >
                      <Twitter size={20} />
                      <span className="font-bold">Twitter / X</span>
                    </a>
                  </div>
                  <p className="text-xs mt-6 text-purple-400 font-medium italic">Stay active, engage with others, and be part of something bigger.</p>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-lg">
                    <Lightbulb className="text-purple-400" size={20} />
                    <h5>💡 What You Can Do</h5>
                  </div>
                  <ul className="list-disc pl-12 space-y-2 text-sm">
                    <li>Share content (memes, posts, videos)</li>
                    <li>Support others by liking, commenting, and sharing</li>
                    <li>Participate in weekly and monthly events</li>
                    <li>Help new members get started</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-lg">
                    <Trophy className="text-purple-400" size={20} />
                    <h5>🏆 Community Rewards</h5>
                  </div>
                  <p className="text-sm pl-8 mb-2">We value active members! You can earn:</p>
                  <ul className="list-disc pl-12 space-y-2 text-sm">
                    <li>Recognition within the community</li>
                    <li>Weekly or monthly rewards</li>
                    <li>Special bonuses for high-quality contributions</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 text-white font-bold text-lg">
                    <ShieldAlert className="text-purple-400" size={20} />
                    <h5>📢 Community Guidelines</h5>
                  </div>
                  <p className="text-sm pl-8 mb-2">To keep the environment positive and productive:</p>
                  <ul className="list-disc pl-12 space-y-2 text-sm">
                    <li>Be respectful and supportive</li>
                    <li>Avoid spam or self-promotion without value</li>
                    <li>Do not use fake engagement or bots</li>
                    <li>Follow all platform rules</li>
                  </ul>
                </section>

                <section className="bg-white/5 p-8 rounded-3xl text-center border border-white/5">
                  <h5 className="text-white font-bold mb-3 text-xl">🌟 Why Join?</h5>
                  <p className="text-purple-200 leading-relaxed italic">
                    "Because this is more than just a scavenger hunt... It’s a movement where your creativity can reach the world 🌍"
                  </p>
                </section>

                <section className="text-center pt-6">
                  <p className="text-white font-bold mb-2">📩 Stay Connected</p>
                  <a href="mailto:joel@bitcoin.com" className="text-purple-400 font-bold hover:underline">joel@bitcoin.com</a>
                </section>

                <p className="text-center text-purple-400 font-bold text-xl pt-4">
                  Let’s build, grow, and win together in the Verse ecosystems 🚀
                </p>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                <button 
                  onClick={() => setIsCommunityModalOpen(false)}
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
            <button 
              onClick={() => setIsTermsModalOpen(true)}
              className="text-purple-300/70 hover:text-white text-sm font-medium transition-colors"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => setIsContactModalOpen(true)}
              className="text-purple-300/70 hover:text-white text-sm font-medium transition-colors"
            >
              Contact Us
            </button>
            <button 
              onClick={() => setIsDocsModalOpen(true)}
              className="text-purple-300/70 hover:text-white text-sm font-medium transition-colors"
            >
              Documentation
            </button>
            <button 
              onClick={() => setIsCommunityModalOpen(true)}
              className="text-purple-300/70 hover:text-white text-sm font-medium transition-colors"
            >
              Community
            </button>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <p className="text-purple-300/40 text-xs font-medium">
              &copy; 2026 Verse. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://www.bitcoin.com/" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                <img 
                  src="https://i.ibb.co/mFcWbDLf/bitcoincom-logo-light-1.png" 
                  alt="Bitcoin.com" 
                  className="h-8 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </a>
              <a href="https://www.getverse.com/" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                <img 
                  src="https://i.ibb.co/PSMbCRh/verse-logo-light-1.png" 
                  alt="GetVerse" 
                  className="h-8 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </a>
            </div>
          </div>
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
