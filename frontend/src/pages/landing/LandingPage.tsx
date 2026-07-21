import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,  Users, ArrowRight, Building2, Globe2,
  ChevronRight, Activity, MapPin, Moon, Sun, ExternalLink,
  BarChart2, Landmark, Shield
} from 'lucide-react';
import { eventsApi } from '../../api/events.api';
import { newsApi } from '../../api/news.api';
import type { EventListItem } from '../../types/event.types';
import type { NewsListItem } from '../../types/news.types';
import heroImg from '../../assets/hero.jpg';
import NewsDetailModal from '../news/NewsDetailModal';
import EventDetailModal from '../events/EventDetailModal';
import { useThemeStore } from '../../store/theme.store';

export default function LandingPage() {
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [news, setNews] = useState<NewsListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useThemeStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, newsRes] = await Promise.all([
          eventsApi.getAll(),
          newsApi.getAll(),
        ]);
        const completedEvents = eventsRes.filter(e => e.status === 'COMPLETED').slice(0, 3);
        setEvents(completedEvents);
        setNews(newsRes.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching data from backend', error);
        setEvents([]);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm dark:shadow-slate-800/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">

            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img src="/vite.jpg" alt="SisterCity Logo" className="h-10 w-auto rounded shadow-sm" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                Adama-Aurora SisterCity
              </span>
            </div>

            {/* Nav */}
            <nav className="hidden md:flex space-x-8">
              <a href="#about" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">About Us</a>
              <a href="#cities" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">City Profiles</a>
              <a href="#events" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Completed Events</a>
              <a href="#news" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">Latest News</a>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Link to="/login" className="hidden sm:inline text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                Sign In
              </Link>
              <Link
                to="/dashboard"
                className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg items-center"
              >
                Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
                className="md:hidden p-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl absolute w-full left-0 shadow-xl transition-all duration-300">
            <div className="flex flex-col p-4 space-y-4">
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2 py-1">About Us</a>
              <a href="#cities" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2 py-1">City Profiles</a>
              <a href="#events" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2 py-1">Completed Events</a>
              <a href="#news" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-2 py-1">Latest News</a>
              <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col space-y-3">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center text-slate-600 dark:text-slate-300 hover:text-blue-600 font-medium py-2">
                  Sign In
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-full font-medium transition-all shadow-md flex items-center justify-center"
                >
                  Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/40 z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-20 pb-24 lg:pt-32 lg:pb-36 flex flex-col lg:flex-row items-center gap-12">
          <div className="text-center lg:text-left lg:w-1/2">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-8 text-slate-900 dark:text-white leading-tight">
              Connecting Cities, <br className="hidden lg:block" />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                Empowering Communities
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Fostering global partnerships through cultural exchange, economic cooperation, and shared innovation.
              Join us in building bridges across borders for a better tomorrow.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <a
                href="#about"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-lg flex items-center justify-center"
              >
                Discover More
              </a>
              <a
                href="#events"
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-8 py-4 rounded-full font-semibold transition-all shadow-sm hover:shadow-md text-lg flex items-center justify-center"
              >
                View Events
              </a>
            </div>
          </div>
          <div className="lg:w-1/2 relative mt-12 lg:mt-0 w-full">
            <div className="absolute inset-0 bg-blue-100/50 dark:bg-blue-900/20 rounded-full blur-3xl transform scale-110 -z-10" />
            <img
              src={heroImg}
              alt="City collaboration"
              className="w-full max-w-lg mx-auto object-contain drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700 ease-in-out"
            />
          </div>
        </div>
      </section>

      {/* ── About Us Section ── */}
      <section id="about" className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              The Adama &amp; Aurora Partnership
            </h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-8" />
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Our sister city initiative bridges continents, uniting the vibrant city of{' '}
              <strong className="text-slate-800 dark:text-slate-200">Adama, Ethiopia</strong> with{' '}
              <strong className="text-slate-800 dark:text-slate-200">Aurora, Colorado</strong>.
              Our shared mission is to foster deep, enduring connections through mutual respect, cultural celebration,
              and economic collaboration. By working together across borders, we are building resilient communities
              and a brighter, interconnected future.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-14">
            {[
              {
                icon: <Globe2 className="h-7 w-7 text-blue-600" />,
                bg: 'bg-blue-100 dark:bg-blue-900/40',
                title: 'Knowledge & Innovation',
                desc: 'Exchanging best practices in urban planning, education, and sustainable development to build smarter, more resilient infrastructure.',
              },
              {
                icon: <Users className="h-7 w-7 text-indigo-600" />,
                bg: 'bg-indigo-100 dark:bg-indigo-900/40',
                title: 'Cultural Exchange',
                desc: 'Celebrating diversity by organizing joint events, delegations, and educational programs that bring our citizens together to share their heritage.',
              },
              {
                icon: <Building2 className="h-7 w-7 text-emerald-600" />,
                bg: 'bg-emerald-100 dark:bg-emerald-900/40',
                title: 'Economic Growth',
                desc: 'Driving mutual prosperity through international trade agreements, business networking, and shared technological innovation.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm hover:shadow-md dark:shadow-slate-800/50 transition-shadow border border-transparent dark:border-slate-800"
              >
                <div className={`w-14 h-14 ${card.bg} rounded-xl flex items-center justify-center mb-6`}>
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">{card.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── City Profiles Section ── */}
      <section id="cities" className="py-24 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Our Partner Cities</h2>
              <div className="w-24 h-1 bg-blue-600 rounded-full" />
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              View Full City Profiles <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          {/* City profile preview cards */}
          <div className="grid md:grid-cols-2 gap-8">

            {/* Adama Card */}
            <div className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl dark:shadow-slate-900/60 transition-all duration-300">
              {/* Card gradient header */}
              <div className="relative bg-gradient-to-br from-[#1a4a8a] to-[#0d2d5c] p-8">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_#60a5fa,_transparent_60%)]" />
                <div className="relative z-10 flex items-start gap-5">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <Landmark className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-white">Adama</h3>
                    <p className="text-blue-200 text-sm mt-0.5 font-medium">Oromia Region · Ethiopia</p>
                    <p className="text-blue-300 text-sm italic mt-1">"Gateway to the Nation"</p>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="bg-white dark:bg-slate-900 p-6 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Population', value: '480,000+' },
                    { label: 'Area', value: '157 km²' },
                    { label: 'Established', value: '1916' },
                  ].map((s) => (
                    <div key={s.label} className="bg-blue-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-[#1a4a8a] dark:text-blue-300">{s.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {[
                    { icon: <Shield className="w-4 h-4 text-blue-500 shrink-0" />, text: 'Industrial & economic hub of central Ethiopia' },
                    { icon: <Globe2 className="w-4 h-4 text-indigo-500 shrink-0" />, text: 'Sister city partnership since 2012' },
                    { icon: <BarChart2 className="w-4 h-4 text-emerald-500 shrink-0" />, text: 'Focus: Education, Trade & Infrastructure' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {item.icon}
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 w-full mt-2 py-2.5 rounded-xl border border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                >
                  View Full Profile <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Aurora Card */}
            <div className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl dark:shadow-slate-900/60 transition-all duration-300">
              {/* Card gradient header */}
              <div className="relative bg-gradient-to-br from-[#312e81] to-[#1e1b4b] p-8">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_#a78bfa,_transparent_60%)]" />
                <div className="relative z-10 flex items-start gap-5">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-white">Aurora</h3>
                    <p className="text-indigo-200 text-sm mt-0.5 font-medium">Colorado · United States</p>
                    <p className="text-indigo-300 text-sm italic mt-1">"Colorado's City of the Future"</p>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="bg-white dark:bg-slate-900 p-6 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Population', value: '390,000+' },
                    { label: 'Area', value: '603 km²' },
                    { label: 'Established', value: '1891' },
                  ].map((s) => (
                    <div key={s.label} className="bg-indigo-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{s.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {[
                    { icon: <Shield className="w-4 h-4 text-indigo-500 shrink-0" />, text: "3rd-largest city in Colorado; culturally diverse" },
                    { icon: <Globe2 className="w-4 h-4 text-blue-500 shrink-0" />, text: 'Sister city partnership since 2012' },
                    { icon: <BarChart2 className="w-4 h-4 text-emerald-500 shrink-0" />, text: 'Focus: Technology, Culture & Public Health' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {item.icon}
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 w-full mt-2 py-2.5 rounded-xl border border-indigo-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                >
                  View Full Profile <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Completed Events Section ── */}
      <section id="events" className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Completed Events</h2>
              <div className="w-24 h-1 bg-blue-600 rounded-full" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Activity className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">No completed events found.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => event.id && setSelectedEventId(event.id)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl dark:hover:shadow-slate-900/60 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs font-bold">
                      <Calendar className="h-4 w-4" />
                      {new Date(event.startDate).toLocaleDateString()}
                    </div>
                    <span className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600 uppercase tracking-wider">
                      {event.eventType.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 flex-grow">
                    {event.title}
                  </h3>

                  <div className="space-y-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <Building2 className="h-4 w-4 mr-2 text-blue-400" />
                      <span className="font-medium">Host: {event.hostCity}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="h-4 w-4 mr-2 text-indigo-400" />
                      <span className="truncate">Venue: {event.venue}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Published News Section ── */}
      <section id="news" className="py-24 bg-white dark:bg-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Latest News</h2>
              <div className="w-24 h-1 bg-blue-600 rounded-full" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Activity className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          ) : news.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">No published news found.</p>
          ) : (
            <div className="space-y-6">
              {news.map((item) => (
                <div
                  key={item.id}
                  onClick={() => item.id && setSelectedNewsId(item.id)}
                  className="bg-slate-50 dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-xl dark:hover:shadow-slate-900/60 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-100 dark:bg-indigo-900/60 group-hover:bg-indigo-600 transition-colors duration-300" />

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center text-sm text-slate-500 dark:text-slate-400 mb-3 gap-4">
                        <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-indigo-100 dark:border-indigo-800">
                          {item.category?.replace('_', ' ')}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5 text-indigo-400" />
                          {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Recent'}
                        </span>
                        <span className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1.5 text-blue-400" />
                          {item.postedByCity}
                        </span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pr-8 leading-tight">
                        {item.title}
                      </h3>
                    </div>
                    <div className="hidden sm:flex items-center justify-center shrink-0 self-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/40 group-hover:border-indigo-200 dark:group-hover:border-indigo-500 group-hover:scale-110 transition-all duration-300">
                        <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <img
              src="/vite.jpg"
              alt="SisterCity Logo"
              className="h-8 w-auto rounded grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            />
            <span className="text-xl font-bold text-white tracking-wide">SisterCity</span>
          </div>
          <p className="mb-4">Building bridges between communities worldwide.</p>
          <div className="flex justify-center gap-6 text-sm mb-6">
            <a href="#about" className="hover:text-blue-400 transition-colors">About Us</a>
            <a href="#cities" className="hover:text-blue-400 transition-colors">City Profiles</a>
            <a href="#events" className="hover:text-blue-400 transition-colors">Events</a>
            <a href="#news" className="hover:text-blue-400 transition-colors">News</a>
          </div>
          <div className="border-t border-slate-800 pt-8 mt-4">
            <p>&copy; {new Date().getFullYear()} SisterCity Initiative. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── Modals ── */}
      {selectedNewsId && (
        <NewsDetailModal
          newsId={selectedNewsId}
          onClose={() => setSelectedNewsId(null)}
          onUpdated={() => {}}
        />
      )}
      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onUpdated={() => {}}
        />
      )}
    </div>
  );
}
