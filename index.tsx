
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { 
  Search, 
  MapPin, 
  Wifi, 
  Wind, 
  Utensils, 
  Dumbbell, 
  Star, 
  Sparkles, 
  MessageSquare, 
  X, 
  ChevronRight,
  Filter,
  Check,
  Heart,
  Calendar,
  Loader2,
  CheckCircle2,
  Bookmark,
  Sun,
  Moon,
  History,
  Trash2,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

// --- Types ---
interface Hostel {
  id: string;
  name: string;
  price: number;
  distance: number; // km from campus
  rating: number;
  amenities: string[];
  description: string;
  image: string;
  type: 'Private' | 'Shared';
}

interface Booking {
  id: string;
  hostelId: string;
  hostelName: string;
  date: string;
  ref: string;
  price: number;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

type AppTab = 'discover' | 'favorites' | 'bookings';

// --- Mock Data ---
const MOCK_HOSTELS: Hostel[] = [
  {
    id: '1',
    name: 'Academic Heights',
    price: 350,
    distance: 0.5,
    rating: 4.8,
    amenities: ['Wifi', 'AC', 'Laundry', 'Meals'],
    description: 'A premium stay right across the main library. Perfect for students who value proximity.',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800',
    type: 'Private'
  },
  {
    id: '2',
    name: 'Quiet Corner Stay',
    price: 220,
    distance: 2.1,
    rating: 4.5,
    amenities: ['Wifi', 'Laundry', 'Kitchen'],
    description: 'Tucked away in a quiet neighborhood. Best for serious studiers and budget seekers.',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
    type: 'Shared'
  },
  {
    id: '3',
    name: 'The Social Hub',
    price: 280,
    distance: 1.2,
    rating: 4.2,
    amenities: ['Wifi', 'Gym', 'Meals', 'Game Room'],
    description: 'Vibrant atmosphere with regular community events. Great for networking.',
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&q=80&w=800',
    type: 'Shared'
  },
  {
    id: '4',
    name: 'Luxe Student Suites',
    price: 500,
    distance: 0.8,
    rating: 4.9,
    amenities: ['Wifi', 'AC', 'Gym', 'Pool', 'Private Kitchen'],
    description: 'Ultra-modern suites with high-end furniture and panoramic campus views.',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800',
    type: 'Private'
  },
  {
    id: '5',
    name: 'Green View Dorms',
    price: 180,
    distance: 3.5,
    rating: 3.9,
    amenities: ['Wifi', 'Meals'],
    description: 'Affordable housing surrounded by greenery. Dedicated shuttle service available.',
    image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=800',
    type: 'Shared'
  },
  {
    id: '6',
    name: 'Tech Haven Residency',
    price: 320,
    distance: 1.5,
    rating: 4.6,
    amenities: ['High-speed Wifi', 'AC', 'Power Backup', 'Study Pods'],
    description: 'Specially designed for IT and Engineering students with 24/7 technical support.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800',
    type: 'Private'
  }
];

// --- Components ---

const AmenityIcon: React.FC<{ name: string }> = ({ name }) => {
  const normalized = name.toLowerCase();
  if (normalized.includes('wifi')) return <Wifi size={14} />;
  if (normalized.includes('ac')) return <Wind size={14} />;
  if (normalized.includes('meal') || normalized.includes('kitchen')) return <Utensils size={14} />;
  if (normalized.includes('gym')) return <Dumbbell size={14} />;
  return <Check size={14} />;
};

const HostelCard: React.FC<{ 
  hostel: Hostel; 
  onBook: (h: Hostel) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  isBooked?: boolean;
}> = ({ hostel, onBook, isFavorite, onToggleFavorite, isBooked }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition-all group">
    <div className="relative h-48 overflow-hidden">
      <img src={hostel.image} alt={hostel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 dark:text-slate-100">
        {isBooked && <CheckCircle2 size={12} className="text-emerald-500" />}
        {hostel.type}
      </div>
      <div className="absolute top-3 right-3 flex gap-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(hostel.id);
          }}
          className={`p-2 rounded-lg transition-all shadow-sm ${isFavorite ? 'bg-rose-500 text-white' : 'bg-white/90 dark:bg-slate-900/90 backdrop-blur text-slate-400 hover:text-rose-500'}`}
        >
          <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <div className="bg-amber-400 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
          <Star size={12} fill="white" /> {hostel.rating}
        </div>
      </div>
    </div>
    <div className="p-5">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{hostel.name}</h3>
        <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">${hostel.price}<span className="text-slate-400 text-xs font-normal">/mo</span></span>
      </div>
      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm mb-4">
        <MapPin size={14} />
        {hostel.distance} km from campus
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {hostel.amenities.slice(0, 3).map(a => (
          <span key={a} className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold">
            <AmenityIcon name={a} />
            {a}
          </span>
        ))}
        {hostel.amenities.length > 3 && <span className="text-[10px] text-slate-400 self-center">+{hostel.amenities.length - 3} more</span>}
      </div>
      <button 
        onClick={() => onBook(hostel)}
        className={`w-full font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 border ${isBooked ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' : 'bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white dark:text-slate-200 border-indigo-100 dark:border-slate-700'}`}
      >
        {isBooked ? 'Manage Booking' : 'View & Book'} <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

const App = () => {
  const [hostels] = useState<Hostel[]>(MOCK_HOSTELS);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState(600);
  const [activeTab, setActiveTab] = useState<AppTab>('discover');
  const [darkMode, setDarkMode] = useState(false);
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial theme and data load
  useEffect(() => {
    const savedFavorites = localStorage.getItem('hostelscout_favorites');
    const savedBookings = localStorage.getItem('hostelscout_bookings');
    const savedTheme = localStorage.getItem('hostelscout_theme');
    
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    if (savedBookings) setBookings(JSON.parse(savedBookings));
    
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
  }, []);

  // Theme effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hostelscout_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hostelscout_theme', 'light');
    }
  }, [darkMode]);

  // Sync data to localStorage
  useEffect(() => {
    localStorage.setItem('hostelscout_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('hostelscout_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleConfirmBooking = async () => {
    if (!selectedHostel) return;
    setIsBookingLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const newRef = `HS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const newBooking: Booking = {
      id: crypto.randomUUID(),
      hostelId: selectedHostel.id,
      hostelName: selectedHostel.name,
      date: new Date().toLocaleString(),
      ref: newRef,
      price: selectedHostel.price
    };
    setBookings(prev => [newBooking, ...prev]);
    setBookingRef(newRef);
    setIsBookingLoading(false);
  };

  const deleteBooking = (id: string) => {
    if (window.confirm('Are you sure you want to remove this booking record?')) {
      setBookings(prev => prev.filter(b => b.id !== id));
      // We don't close the modal here to allow the detail view to reactive switch buttons
    }
  };

  const handleCancelBookingByHostel = (hostelId: string) => {
    if (window.confirm('Are you sure you want to cancel your booking for this hostel?')) {
      setBookings(prev => prev.filter(b => b.hostelId !== hostelId));
    }
  };

  const closeBookingModal = () => {
    setSelectedHostel(null);
    setBookingRef(null);
    setIsBookingLoading(false);
  };

  const filteredHostels = useMemo(() => {
    return hostels.filter(h => {
      const matchesSearch = (h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             h.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPrice = h.price <= priceRange;
      if (activeTab === 'favorites') return matchesSearch && matchesPrice && favorites.includes(h.id);
      if (activeTab === 'bookings') return matchesSearch && matchesPrice && bookings.some(b => b.hostelId === h.id);
      return matchesSearch && matchesPrice;
    });
  }, [hostels, searchTerm, priceRange, activeTab, favorites, bookings]);

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const userMsg = userInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setUserInput('');
    setIsTyping(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are "HostelScout AI", a helpful assistant for university students. Based on the following available hostels, suggest the best options for the user's request.\nAvailable Hostels:\n${JSON.stringify(hostels, null, 2)}\nUser Query: "${userMsg}"\nInstructions: 1. Recommend 1-3 hostels. 2. Explain WHY. 3. Keep it friendly.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setChatHistory(prev => [...prev, { role: 'ai', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Oops, my circuits are a bit jammed!" }]);
    } finally { setIsTyping(false); }
  };

  const isCurrentHostelBooked = selectedHostel ? bookings.some(b => b.hostelId === selectedHostel.id) : false;

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center transition-colors">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('discover')}>
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Sparkles size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight text-indigo-900 dark:text-indigo-400">HostelScout</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-medium text-slate-600 dark:text-slate-400">
          <button onClick={() => setActiveTab('discover')} className={`pb-1 transition-all ${activeTab === 'discover' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'hover:text-indigo-600 dark:hover:text-indigo-300'}`}>Discover</button>
          <button onClick={() => setActiveTab('favorites')} className={`pb-1 transition-all flex items-center gap-1.5 ${activeTab === 'favorites' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'hover:text-indigo-600 dark:hover:text-indigo-300'}`}>
            <Heart size={16} fill={activeTab === 'favorites' ? "currentColor" : "none"} />
            Favorites
          </button>
          <button onClick={() => setActiveTab('bookings')} className={`pb-1 transition-all flex items-center gap-1.5 ${activeTab === 'bookings' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400' : 'hover:text-indigo-600 dark:hover:text-indigo-300'}`}>
            <Bookmark size={16} />
            My Bookings
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-all"
            title="Toggle Dark Mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <a href="mailto:agent4scope@gmail.com" className="hidden sm:block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Support</a>
          <button className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white px-5 py-2 rounded-xl font-medium hover:opacity-90 transition-all">Sign In</button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col md:flex-row max-w-[1400px] mx-auto w-full p-6 gap-8">
        {/* Left Side: Search & Listings */}
        <div className="flex-1 space-y-8">
          <section className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                {activeTab === 'discover' && <>Find your perfect <span className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-200">home</span> on campus.</>}
                {activeTab === 'favorites' && <>Your <span className="text-rose-500 dark:text-rose-400 underline decoration-rose-200">favorites</span> ready to explore.</>}
                {activeTab === 'bookings' && <>Manage your <span className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-200">bookings</span> efficiently.</>}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                {activeTab === 'discover' && 'Browse verified student hostels near your university.'}
                {activeTab === 'favorites' && 'A collection of the best stays you bookmarked.'}
                {activeTab === 'bookings' && 'Track and manage your accommodation status.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400 dark:text-slate-600" size={20} />
                <input 
                  type="text" placeholder="Search by name..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all text-sm dark:text-slate-100 dark:placeholder-slate-500"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col justify-center px-2">
                <div className="flex justify-between text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                  <span>Price Cap</span>
                  <span className="text-indigo-600 dark:text-indigo-400">${priceRange}/mo</span>
                </div>
                <input 
                  type="range" min="150" max="600" step="10" value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 rounded-full appearance-none bg-slate-200 dark:bg-slate-800 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-2.5 rounded-2xl text-sm font-semibold hover:bg-white dark:hover:bg-slate-700 transition-all dark:text-slate-300">
                  <Filter size={16} /> Filters
                </button>
                <button 
                  onClick={() => setIsAiOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 py-2.5 rounded-2xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all border border-indigo-200 dark:border-indigo-900/50"
                >
                  <Sparkles size={16} /> Ask AI
                </button>
              </div>
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight text-sm">Showing {filteredHostels.length} {activeTab}</h2>
            </div>
            {filteredHostels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHostels.map(hostel => (
                  <HostelCard key={hostel.id} hostel={hostel} onBook={setSelectedHostel} isFavorite={favorites.includes(hostel.id)} onToggleFavorite={toggleFavorite} isBooked={bookings.some(b => b.hostelId === hostel.id)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
                <Search size={48} className="opacity-20 mb-4" />
                <p className="font-medium">No results found.</p>
                <button onClick={() => { setSearchTerm(''); setPriceRange(600); setActiveTab('discover'); }} className="text-indigo-600 dark:text-indigo-400 mt-2 text-sm font-bold hover:underline">Reset View</button>
              </div>
            )}
          </section>

          {/* Booking History Section - Only visible in bookings tab */}
          {activeTab === 'bookings' && bookings.length > 0 && (
            <section className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-6">
                <History className="text-indigo-600 dark:text-indigo-400" size={20} />
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Booking History</h2>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
                        <th className="px-6 py-4">Hostel Name</th>
                        <th className="px-6 py-4">Date & Time</th>
                        <th className="px-6 py-4">Reference</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 font-bold">{booking.hostelName}</td>
                          <td className="px-6 py-4">{booking.date}</td>
                          <td className="px-6 py-4">
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs text-indigo-600 dark:text-indigo-400">{booking.ref}</span>
                          </td>
                          <td className="px-6 py-4">${booking.price}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                              <Check size={12} strokeWidth={3} />
                              Confirmed
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                title="View Details"
                              >
                                <ExternalLink size={16} />
                              </button>
                              <button 
                                onClick={() => deleteBooking(booking.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* AI Assistant Aside */}
        <aside className={`fixed inset-y-0 right-0 w-full sm:w-[400px] glass dark:bg-slate-900/90 z-50 shadow-2xl transition-transform duration-300 transform border-l border-white/20 dark:border-slate-800 ${isAiOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0 md:w-[350px] md:shadow-none md:border-l-0 md:bg-transparent md:backdrop-blur-none ${!isAiOpen ? 'md:hidden' : 'md:flex'} flex flex-col rounded-3xl md:rounded-none overflow-hidden h-[90vh] md:h-auto`}>
          <div className="bg-white/80 dark:bg-slate-900/80 p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white"><Sparkles size={16} /></div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Scout Assistant</h3>
            </div>
            <button onClick={() => setIsAiOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            {chatHistory.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400"><MessageSquare size={24} /></div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Finding your way?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-6">Ask me about nearby gyms, quiet study zones, or best value for money.</p>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-sm'}`}>{msg.text}</div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 bg-white/50 dark:bg-slate-900/50 shrink-0 border-t border-slate-100 dark:border-slate-800">
            <form onSubmit={handleAiSearch} className="flex gap-2">
              <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="How can I help you?" className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-sm dark:text-slate-100" />
              <button type="submit" disabled={isTyping} className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"><ChevronRight size={20} /></button>
            </form>
          </div>
        </aside>
      </main>

      {/* Booking Modal */}
      {selectedHostel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={closeBookingModal}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border dark:border-slate-800">
            {bookingRef ? (
              <div className="p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"><CheckCircle2 size={48} /></div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Booking Confirmed!</h2>
                  <p className="text-slate-500 dark:text-slate-400">Your request for <strong>{selectedHostel.name}</strong> has been received.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl inline-block border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Reference Number</span>
                  <span className="text-xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">{bookingRef}</span>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <button onClick={() => { setActiveTab('bookings'); closeBookingModal(); }} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all">View in My Bookings</button>
                  <button onClick={closeBookingModal} className="w-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-semibold py-2">Dismiss</button>
                </div>
              </div>
            ) : (
              <>
                <div className="h-56 overflow-hidden relative">
                  <img src={selectedHostel.image} alt={selectedHostel.name} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => setSelectedHostel(null)} className="bg-black/20 backdrop-blur-md hover:bg-black/40 text-white p-2 rounded-full transition-colors"><X size={20} /></button>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedHostel.name}</h2>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm mt-1"><MapPin size={16} /> {selectedHostel.distance} km from campus</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${selectedHostel.price}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-widest font-bold">monthly rent</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex items-center gap-3">
                      <div className="bg-white dark:bg-slate-700 p-2 rounded-lg text-indigo-500 dark:text-indigo-400 shadow-sm"><Calendar size={18} /></div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Stay Date</div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Next Available</div>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex items-center gap-3">
                      <div className="bg-white dark:bg-slate-700 p-2 rounded-lg text-indigo-500 dark:text-indigo-400 shadow-sm"><Check size={18} /></div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Status</div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Verifying...</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">{selectedHostel.description}</p>
                  
                  {isCurrentHostelBooked ? (
                    <div className="space-y-4">
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">You already have an active booking here.</p>
                          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">You can manage or remove this booking from your history.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCancelBookingByHostel(selectedHostel.id)}
                        className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 border border-rose-200 dark:border-rose-900/50 group"
                      >
                        <Trash2 size={20} className="group-hover:rotate-12 transition-transform" />
                        Cancel This Booking
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <button onClick={handleConfirmBooking} disabled={isBookingLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-80">
                        {isBookingLoading ? <><Loader2 size={20} className="animate-spin" />Processing...</> : 'Confirm Booking'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 px-6 transition-colors">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-xl text-white"><Sparkles size={16} /></div>
              <span className="font-bold text-lg text-indigo-900 dark:text-indigo-400">HostelScout</span>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-sm">Empowering students with verified housing solutions using modern AI.</p>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-slate-800 dark:text-slate-200">Explore</h5>
            <ul className="space-y-2 text-slate-500 dark:text-slate-400 text-sm">
              <li><button onClick={() => setActiveTab('discover')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left w-full">All Hostels</button></li>
              <li><button onClick={() => setActiveTab('favorites')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left w-full">Your Favorites</button></li>
              <li><button onClick={() => setActiveTab('bookings')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left w-full">Your Bookings</button></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-slate-800 dark:text-slate-200">Support</h5>
            <ul className="space-y-2 text-slate-500 dark:text-slate-400 text-sm">
              <li><a href="mailto:agent4scope@gmail.com" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">Contact Team</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">Student Guide</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">Terms of Use</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4 text-slate-800 dark:text-slate-200">Join the Scout</h5>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg px-3 py-2 text-xs w-full focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none dark:text-slate-100" />
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-bold text-xs transition-all">Go</button>
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-600 text-xs">
          © {new Date().getFullYear()} HostelScout. Built for students.
        </div>
      </footer>

      {/* Floating AI Button */}
      {!isAiOpen && (
        <button onClick={() => setIsAiOpen(true)} className="fixed bottom-6 right-6 bg-slate-900 dark:bg-indigo-600 text-white w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center animate-bounce z-40 hover:scale-105 transition-all">
          <Sparkles size={24} />
        </button>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
