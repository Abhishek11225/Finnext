'use client';

import { useCallback, useEffect, useState } from 'react';
import { GraduationCap, Loader2, Send, Ticket } from 'lucide-react';
import { useUserSocket } from '@/hooks/useUserSocket';

type Mentorship = {
  _id: string;
  professionalId: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  demoSessionLink?: string;
  completedAt?: string;
  growwCouponCode?: string;
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackSubmittedAt?: string;
  createdAt: string;
};

export default function MyMentorships() {
  const [items, setItems] = useState<Mentorship[]>([]);
  const [userId, setUserId] = useState<string>();
  const [role, setRole] = useState<'user' | 'professional'>('user');
  const [loading, setLoading] = useState(true);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, { rating: number; comment: string }>>({});
  const [submittingFeedbackId, setSubmittingFeedbackId] = useState<string | null>(null);

  const fetchMentorships = useCallback(async () => {
    try {
      const [requestsRes, profileRes] = await Promise.all([
        fetch('/api/mentorship?role=student'),
        fetch('/api/profile'),
      ]);
      if (requestsRes.ok) setItems(await requestsRes.json());
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setUserId(profile.userId);
        setRole(profile.role || 'user');
      }
    } catch (error) {
      console.error('Failed to load mentorships', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentorships();
  }, [fetchMentorships]);

  useUserSocket(userId, {
    'mentorship:accepted': fetchMentorships,
    'mentorship:rejected': fetchMentorships,
    'mentorship:completed': fetchMentorships,
    'mentorship:feedback': fetchMentorships,
  });

  const submitFeedback = async (requestId: string) => {
    const draft = feedbackDrafts[requestId] || { rating: 5, comment: '' };
    setSubmittingFeedbackId(requestId);
    try {
      const res = await fetch('/api/mentorship', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action: 'feedback',
          feedbackRating: draft.rating,
          feedbackComment: draft.comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit feedback');
      fetchMentorships();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmittingFeedbackId(null);
    }
  };

  return (
    role === 'professional' ? null :
    <section style={{ background: '#141414', border: '1px solid #212328', borderRadius: 8, padding: 20 }}>
      <h2 style={{ color: '#f5f5f5', fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <GraduationCap size={18} style={{ color: '#FDD458' }} /> My Mentorships
      </h2>

      {loading ? (
        <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: '#FDD458' }} />
      ) : items.length === 0 ? (
        <p style={{ color: '#9095A1', fontSize: 13 }}>No mentorship requests yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {items.map((item) => (
            <div key={item._id} style={{ background: '#0B0D10', border: '1px solid #1E2229', borderRadius: 8, padding: 14 }}>
              <strong style={{ color: '#CCDADC', fontSize: 14, display: 'block' }}>
                {item.professionalId?.name || 'Professional'}
              </strong>
              <span style={{ color: '#9095A1', fontSize: 12, display: 'block', marginTop: 4 }}>
                Requested {new Date(item.createdAt).toLocaleDateString('en-IN')}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  marginTop: 10,
                  padding: '4px 9px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  color: ['accepted', 'completed'].includes(item.status) ? '#0FEDBE' : item.status === 'rejected' ? '#FF495B' : '#FDD458',
                  background: ['accepted', 'completed'].includes(item.status) ? 'rgba(15,237,190,0.1)' : item.status === 'rejected' ? 'rgba(255,73,91,0.1)' : 'rgba(253,212,88,0.1)',
                }}
              >
                {item.status.toUpperCase()}
              </span>
              {item.status === 'accepted' && item.demoSessionLink && (
                <a
                  href={item.demoSessionLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    marginTop: 10,
                    color: '#FDD458',
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: 'none',
                  }}
                >
                  Join Demo Session
                </a>
              )}
              {item.status === 'completed' && item.growwCouponCode && (
                <div style={{ marginTop: 10, padding: 10, borderRadius: 8, border: '1px solid rgba(15,237,190,0.25)', background: 'rgba(15,237,190,0.08)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0FEDBE', fontSize: 12, fontWeight: 800 }}>
                    <Ticket size={13} /> Groww Coupon
                  </span>
                  <code style={{ display: 'block', marginTop: 5, color: '#CCDADC', fontSize: 13 }}>{item.growwCouponCode}</code>
                </div>
              )}
              {item.status === 'completed' && !item.feedbackSubmittedAt && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ color: '#CCDADC', fontSize: 12, fontWeight: 700 }}>Feedback</label>
                  <select
                    value={feedbackDrafts[item._id]?.rating || 5}
                    onChange={(e) =>
                      setFeedbackDrafts((drafts) => ({
                        ...drafts,
                        [item._id]: { rating: Number(e.target.value), comment: drafts[item._id]?.comment || '' },
                      }))
                    }
                    style={{ background: '#040507', border: '1px solid #30333A', borderRadius: 6, color: '#CCDADC', padding: '8px 10px', fontSize: 12 }}
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>{rating} / 5</option>
                    ))}
                  </select>
                  <textarea
                    value={feedbackDrafts[item._id]?.comment || ''}
                    onChange={(e) =>
                      setFeedbackDrafts((drafts) => ({
                        ...drafts,
                        [item._id]: { rating: drafts[item._id]?.rating || 5, comment: e.target.value },
                      }))
                    }
                    placeholder="Share feedback for this session..."
                    rows={2}
                    style={{ background: '#040507', border: '1px solid #30333A', borderRadius: 6, color: '#CCDADC', padding: '8px 10px', fontSize: 12, resize: 'vertical' }}
                  />
                  <button
                    onClick={() => submitFeedback(item._id)}
                    disabled={submittingFeedbackId === item._id}
                    style={{ width: 'fit-content', background: '#FDD458', border: 'none', borderRadius: 6, color: '#0A0A0A', padding: '8px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {submittingFeedbackId === item._id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
                    Submit Feedback
                  </button>
                </div>
              )}
              {item.feedbackSubmittedAt && (
                <p style={{ color: '#0FEDBE', fontSize: 12, fontWeight: 700, marginTop: 10 }}>Feedback submitted. Thank you.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
