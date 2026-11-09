import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type?: string;
  minutes?: number;
  points?: number;
  occurredAt?: string;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [status, setStatus] = useState<'loading' | 'empty' | 'error' | 'success'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadActivities() {
      try {
        const payload = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        if (!active) return;
        const items = payload.activities ?? [];
        setActivities(items);
        setStatus(items.length === 0 ? 'empty' : 'success');
      } catch {
        if (!active) return;
        setStatus('error');
        setError('Unable to load activities.');
      }
    }

    void loadActivities();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      status={status}
      emptyText="No activities"
      errorText={error || 'Unable to load activities.'}
    >
      <ul className="list-group list-group-flush">
        {activities.map((activity, index) => (
          <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item">
            <strong>{activity.type ?? 'Activity'}</strong> · {activity.minutes ?? 0} minutes · {activity.points ?? 0} points
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
