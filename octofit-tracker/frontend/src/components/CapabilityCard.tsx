import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  status?: 'loading' | 'empty' | 'error' | 'success';
  emptyText?: string;
  errorText?: string;
  children?: ReactNode;
};

export function CapabilityCard({
  title,
  description,
  status = 'success',
  emptyText = 'No items available.',
  errorText = 'Unable to load data.',
  children,
}: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {status === 'loading' && <p role="status">Loading...</p>}
        {status === 'empty' && <p role="status">{emptyText}</p>}
        {status === 'error' && <div role="alert">{errorText}</div>}
        {status === 'success' && children}
      </div>
    </section>
  );
}
