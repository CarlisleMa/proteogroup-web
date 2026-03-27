'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';

interface Annotation {
  id: number;
  reviewer_id: number;
  entity_type: string;
  entity_id: string;
  biological_plausibility: number | null;
  clinical_relevance: number | null;
  data_quality: number | null;
  notes: string | null;
  tags: string[];
  status: string;
  created_at: string;
}

interface ReviewStats {
  total_annotations: number;
  by_entity_type: {
    entity_type: string;
    count: number;
    avg_plausibility: number | null;
  }[];
}

export default function ReviewPage() {
  const [token, setToken] = useState<string | null>(null);
  const [reviewer, setReviewer] = useState<{
    id: number;
    username: string;
    display_name: string;
    role: string;
  } | null>(null);

  // Load auth from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('review_token');
    const savedReviewer = localStorage.getItem('review_user');
    if (savedToken && savedReviewer) {
      setToken(savedToken);
      setReviewer(JSON.parse(savedReviewer));
    }
  }, []);

  const { data: stats } = useSWR<ReviewStats>(
    '/api/review/stats',
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: annotations } = useSWR<Annotation[]>(
    '/api/review/annotations?limit=20',
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: myAnnotations } = useSWR<Annotation[]>(
    token ? '/api/review/my-annotations' : null,
    (url: string) =>
      apiFetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    { revalidateOnFocus: false },
  );

  function handleLogout() {
    setToken(null);
    setReviewer(null);
    localStorage.removeItem('review_token');
    localStorage.removeItem('review_user');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <PageHeader
          title="Expert Review"
          description="Review and annotate proteogroups, proteins, and methods with expert knowledge."
        />
        <div className="flex items-center gap-3 pt-1">
          {reviewer ? (
            <>
              <span className="text-sm text-slate-600 font-medium">
                {reviewer.display_name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/review/login"
              className="btn-primary"
            >
              Sign in to review
            </Link>
          )}
        </div>
      </div>

      {/* Stats overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 stagger-children">
          <div className="card-accent p-5">
            <p className="text-sm text-slate-400 font-medium">Total Reviews</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {stats.total_annotations}
            </p>
          </div>
          {stats.by_entity_type.map((et) => (
            <div key={et.entity_type} className="card-accent p-5">
              <p className="text-sm text-slate-400 font-medium capitalize">
                {et.entity_type} Reviews
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {et.count}
              </p>
              {et.avg_plausibility != null && (
                <p className="text-xs text-slate-400 mt-1">
                  avg plausibility {et.avg_plausibility}/5
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My annotations */}
        {reviewer && (
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              My Annotations
            </h2>
            {myAnnotations && myAnnotations.length > 0 ? (
              <div className="space-y-3">
                {myAnnotations.map((a) => (
                  <AnnotationCard key={a.id} annotation={a} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-card p-8 text-center">
                <p className="text-sm text-slate-400">
                  No annotations yet. Visit a proteogroup or protein page to
                  add your expert review.
                </p>
              </div>
            )}
          </section>
        )}

        {/* All annotations */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Recent Annotations
          </h2>
          {annotations && annotations.length > 0 ? (
            <div className="space-y-3">
              {annotations.map((a) => (
                <AnnotationCard key={a.id} annotation={a} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-card p-8 text-center">
              <p className="text-sm text-slate-400">No annotations yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function AnnotationCard({ annotation: a }: { annotation: Annotation }) {
  function entityLink(type: string, id: string) {
    if (type === 'proteogroup') {
      const parts = id.split(':');
      if (parts.length === 2) {
        return `/proteogroups/${encodeURIComponent(parts[0])}/${parts[1]}`;
      }
    }
    if (type === 'protein') return `/proteins/${encodeURIComponent(id)}`;
    if (type === 'method') return `/methods/${encodeURIComponent(id)}`;
    return '#';
  }

  return (
    <div className="bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <Link
          href={entityLink(a.entity_type, a.entity_id)}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          {a.entity_type}: {a.entity_id}
        </Link>
        <span className="text-xs text-slate-400">
          {new Date(a.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="flex gap-4 text-xs text-slate-500 mb-2">
        {a.biological_plausibility != null && (
          <span>Plausibility: {a.biological_plausibility}/5</span>
        )}
        {a.clinical_relevance != null && (
          <span>Clinical: {a.clinical_relevance}/5</span>
        )}
        {a.data_quality != null && (
          <span>Data Quality: {a.data_quality}/5</span>
        )}
      </div>

      {a.notes && (
        <p className="text-sm text-slate-600 line-clamp-3">{a.notes}</p>
      )}

      {a.tags && a.tags.length > 0 && (
        <div className="flex gap-1.5 mt-2.5">
          {a.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-2.5 py-0.5 bg-slate-50 text-slate-500 text-xs rounded-lg font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
