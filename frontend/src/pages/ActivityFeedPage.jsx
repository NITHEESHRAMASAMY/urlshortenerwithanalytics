import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Skeleton from '../components/Skeleton';
import { 
  Activity, 
  PlusCircle, 
  Trash2, 
  MousePointerClick, 
  RefreshCw, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

const ActivityFeedPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const { data } = await axios.get('/activities');
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATED':
        return <PlusCircle className="h-4 w-4 text-emerald-green" />;
      case 'DELETED':
        return <Trash2 className="h-4 w-4 text-red-400" />;
      case 'CLICKED':
        return <MousePointerClick className="h-4 w-4 text-luxury-gold animate-bounce" />;
      case 'UPDATED':
        return <RefreshCw className="h-4 w-4 text-blue-400" />;
      default:
        return <Activity className="h-4 w-4 text-neutral-400" />;
    }
  };

  const getActionBorderColor = (action) => {
    switch (action) {
      case 'CREATED':
        return 'border-emerald-green/45';
      case 'DELETED':
        return 'border-red-400/45';
      case 'CLICKED':
        return 'border-luxury-gold/45';
      case 'UPDATED':
        return 'border-blue-400/45';
      default:
        return 'border-neutral-800';
    }
  };

  return (
    <div className="min-h-screen bg-rich-black flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow mx-auto max-w-3xl w-full px-4 sm:px-6 py-8">
        
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-500 mb-6 uppercase tracking-wider">
          <Link to="/dashboard" className="hover:text-emerald-green transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-neutral-400">Activity Logs</span>
        </div>

        <div className="flex items-center space-x-3 mb-8">
          <div className="p-2.5 rounded-lg bg-emerald-green/10 text-emerald-green border border-emerald-green/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-outfit text-2xl font-bold text-white">Activity Timeline</h1>
            <p className="text-xs text-neutral-500 mt-0.5 font-medium">Real-time chronology of your NexLink event streams.</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-dashed border-neutral-900 bg-[#0C0C0C]/30 text-neutral-500">
            <Activity className="h-12 w-12 mx-auto text-neutral-800 mb-3" />
            <p className="text-sm font-medium">No activity logged yet</p>
            <p className="text-xs text-neutral-600 mt-1">Shorten or click links to populate this log timeline.</p>
          </div>
        ) : (
          <div className="relative border-l border-neutral-800/80 ml-4 pl-6 space-y-6">
            {activities.map((act) => (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                {/* Timeline dot icon container */}
                <div className={`absolute -left-[35px] top-1.5 flex items-center justify-center h-6.5 w-6.5 rounded-full bg-[#0A0A0A] border ${getActionBorderColor(act.action)} shadow-md`}>
                  {getActionIcon(act.action)}
                </div>

                {/* Timeline Card */}
                <div className="p-4 rounded-xl border border-neutral-900 bg-[#0C0C0C] hover:border-neutral-850 hover:bg-[#0E0E0E] transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      {act.action}
                    </span>
                    <span className="text-[10px] text-neutral-600 font-semibold">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {act.details}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default ActivityFeedPage;
