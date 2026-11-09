import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'empty' | 'error' | 'success'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      try {
        const payload = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (!active) return;
        const items = payload.leaderboard ?? [];
        setRows(items);
        setStatus(items.length === 0 ? 'empty' : 'success');
      } catch {
        if (!active) return;
        setStatus('error');
        setError('Unable to load leaderboard.');
      }
    }

    void loadLeaderboard();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      status={status}
      emptyText="No leaderboard"
      errorText={error || 'Unable to load leaderboard.'}
    >
      <ol className="list-group list-group-numbered">
        {rows.map((entry, index) => (
          <li key={`${entry.teamName ?? 'team'}-${index}`} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{entry.teamName ?? 'Team'} </span>
            <span>{entry.totalPoints ?? 0}</span>
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
