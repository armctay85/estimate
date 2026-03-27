import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  FileText, 
  Edit, 
  CheckCircle, 
  MessageSquare, 
  Upload,
  Clock,
  MoreHorizontal
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

interface Activity {
  id: string;
  type: 'comment' | 'file_upload' | 'edit' | 'approval' | 'status_change' | 'mention';
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  content: string;
  timestamp: string;
  metadata?: {
    fileName?: string;
    editType?: string;
    oldValue?: string;
    newValue?: string;
    commentCount?: number;
  };
}

interface ActivityFeedProps {
  activities: Activity[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

const activityConfig = {
  comment: { 
    icon: MessageSquare, 
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    label: 'Commented'
  },
  file_upload: { 
    icon: Upload, 
    color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    label: 'Uploaded'
  },
  edit: { 
    icon: Edit, 
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    label: 'Edited'
  },
  approval: { 
    icon: CheckCircle, 
    color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    label: 'Approved'
  },
  status_change: { 
    icon: FileText, 
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    label: 'Updated status'
  },
  mention: { 
    icon: User, 
    color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    label: 'Mentioned'
  },
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return past.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
};

const groupByDate = (activities: Activity[]) => {
  const groups: { [key: string]: Activity[] } = {};
  
  activities.forEach(activity => {
    const date = new Date(activity.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Yesterday';
    } else {
      key = date.toLocaleDateString('en-AU', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(activity);
  });
  
  return groups;
};

export function ActivityFeed({ 
  activities, 
  onLoadMore, 
  hasMore = false,
  loading = false 
}: ActivityFeedProps) {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const groupedActivities = groupByDate(activities);

  const toggleComments = (id: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (activities.length === 0) {
    return (
      <div className="card-premium p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No activity yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Activity will appear here as the project progresses
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedActivities).map(([date, dayActivities], groupIndex) => (
        <motion.div
          key={date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
        >
          {/* Date Header */}
          <div className="flex items-center gap-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {date}
            </h4>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          </div>

          {/* Activities */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {dayActivities.map((activity, index) => (
                <ActivityItem 
                  key={activity.id} 
                  activity={activity}
                  index={index}
                  isExpanded={expandedComments.has(activity.id)}
                  onToggleComments={() => toggleComments(activity.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ))}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {loading ? 'Loading...' : 'Load more activity'}
          </button>
        </div>
      )}
    </div>
  );
}

function ActivityItem({ 
  activity, 
  index,
  isExpanded,
  onToggleComments
}: { 
  activity: Activity;
  index: number;
  isExpanded: boolean;
  onToggleComments: () => void;
}) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      className="group flex gap-4"
    >
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-xl ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="w-px flex-1 bg-gray-200 dark:bg-gray-800 my-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              {activity.user.avatar ? (
                <img src={activity.user.avatar} alt={activity.user.name} />
              ) : (
                <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">
                  {activity.user.initials}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {activity.user.name}
                </span>
                <span className="text-sm text-gray-500">{config.label}</span>
              </div>
              <span className="text-xs text-gray-400">
                {formatTimeAgo(activity.timestamp)}
              </span>
            </div>
          </div>

          <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Activity Content */}
        <div className="mt-2 ml-11">
          <p className="text-gray-700 dark:text-gray-300">{activity.content}</p>

          {/* File Upload Metadata */}
          {activity.type === 'file_upload' && activity.metadata?.fileName && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.metadata.fileName}
              </span>
            </div>
          )}

          {/* Edit Metadata */}
          {activity.type === 'edit' && activity.metadata && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">{activity.metadata.editType}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 line-through">{activity.metadata.oldValue}</span>
                <span className="text-gray-400">→</span>
                <span className="text-green-600 dark:text-green-400 font-medium">{activity.metadata.newValue}</span>
              </div>
            </div>
          )}

          {/* Comment Thread Indicator */}
          {activity.metadata?.commentCount && activity.metadata.commentCount > 0 && (
            <button
              onClick={onToggleComments}
              className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{activity.metadata.commentCount} replies</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Activity Summary for dashboard
export function ActivitySummary({ activities }: { activities: Activity[] }) {
  const recentActivities = activities.slice(0, 5);

  return (
    <div className="card-premium p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
          View all
        </button>
      </div>

      <div className="space-y-3">
        {recentActivities.map((activity, index) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
            >
              <div className={`p-1.5 rounded-lg ${config.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {activity.user.name} {config.label.toLowerCase()}
                </p>
                <p className="text-xs text-gray-500 truncate">{activity.content}</p>
              </div>
              <span className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
