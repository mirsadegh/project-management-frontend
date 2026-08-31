// src/components/ActivityFeed.tsx
import { Activity as ActivityIcon, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { activityService } from '../services/activityService';


const formatRelativeTime = (iso: string): string => {
  const date = new Date(iso);
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);
  if (diffSec < 60) return 'لحظاتی پیش';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} دقیقه پیش`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ساعت پیش`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} روز پیش`;
  return date.toLocaleDateString('fa-IR');
};

const ActivityFeed: React.FC = () => {
  const { data: activities, isLoading, isError } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => activityService.getRecentActivity(),
    refetchInterval: 1000 * 60,
  });

  if (isLoading) {
    return (
      <div className="activity-feed">
        <h3>فعالیت‌های اخیر</h3>
        <div className="activity-feed-loading">در حال بارگذاری...</div>
      </div>
    );
  }

  if (isError || !activities || activities.length === 0) {
    return (
      <div className="activity-feed">
        <h3>فعالیت‌های اخیر</h3>
        <div className="activity-feed-empty">
          <Activity size={0} aria-hidden="true" />
          <p>فعالیتی برای نمایش وجود ندارد.</p>
        </div>
      </div>
    );
  }

  const recent = activities.slice(0, 10);

  return (
    <div className="activity-feed">
      <h3>فعالیت‌های اخیر</h3>
      <ul className="activity-feed-list">
        {recent.map((item) => (
          <li key={item.id} className="activity-feed-item">
            <div className="activity-feed-icon" aria-hidden="true">
              <Activity size={18} />
            </div>
            <div className="activity-feed-content">
              <p className="activity-feed-description">{item.description}</p>
              <div className="activity-feed-meta">
                <span className="activity-feed-user">
                  {item.user.full_name || item.user.username}
                </span>
                <span className="activity-feed-time">
                  <Clock size={12} aria-hidden="true" />
                  {formatRelativeTime(item.created_at)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityFeed;