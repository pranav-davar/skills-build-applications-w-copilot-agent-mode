import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name?: string;
  mascot?: string;
  members?: Array<string | { _id?: string; toString?: () => string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [status, setStatus] = useState<'loading' | 'empty' | 'error' | 'success'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      try {
        const payload = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        if (!active) return;
        const items = payload.teams ?? [];
        setTeams(items);
        setStatus(items.length === 0 ? 'empty' : 'success');
      } catch {
        if (!active) return;
        setStatus('error');
        setError('Unable to load teams.');
      }
    }

    void loadTeams();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      status={status}
      emptyText="No teams"
      errorText={error || 'Unable to load teams.'}
    >
      <ul className="list-group list-group-flush">
        {teams.map((team, index) => (
          <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item">
            <strong>{team.name ?? 'Team'}</strong> <span className="text-muted">({team.mascot ?? 'Mascot'})</span>
            <div>{(team.members ?? []).map((member) => String(member)).join(', ') || 'No members yet'}</div>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
