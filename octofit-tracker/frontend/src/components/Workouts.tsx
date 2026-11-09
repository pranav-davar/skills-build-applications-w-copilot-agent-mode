import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  reason?: string;
  minutes?: number;
  difficulty?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [status, setStatus] = useState<'loading' | 'empty' | 'error' | 'success'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSuggestions() {
      try {
        const payload = await getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        if (!active) return;
        const items = payload.suggestions ?? [];
        setSuggestions(items);
        setStatus(items.length === 0 ? 'empty' : 'success');
      } catch {
        if (!active) return;
        setStatus('error');
        setError('Unable to load workout suggestions.');
      }
    }

    void loadSuggestions();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      status={status}
      emptyText="No workout suggestions"
      errorText={error || 'Unable to load workout suggestions.'}
    >
      <ul className="list-group list-group-flush">
        {suggestions.map((workout, index) => (
          <li key={`${workout.title ?? 'workout'}-${index}`} className="list-group-item">
            <strong>{workout.title ?? 'Workout'}</strong>
            <div>{workout.focus ?? 'General'} · {workout.minutes ?? 0} minutes · {workout.difficulty ?? 'varied'}</div>
            <small>{workout.reason ?? 'Suggested based on recent activity.'}</small>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
