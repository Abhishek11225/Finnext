'use client';

import { useState, useEffect } from 'react';
import { Award, Loader2, Star, CheckCircle, Search, HelpCircle, Users, BookOpen, Send } from 'lucide-react';
import { useUserSocket } from '@/hooks/useUserSocket';

type Professional = {
  _id: string;
  name: string;
  email: string;
  professionalProfile: {
    experience: number;
    tradingStyle: 'Intraday' | 'Swing' | 'Long Term';
    brokerName: string;
    portfolioUrl?: string;
    portfolioValue: number;
    bio: string;
    verificationStatus: string;
    rating: number;
    studentsCount: number;
  };
};

type MentorshipRequestType = {
  _id: string;
  professionalId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackSubmittedAt?: string;
};

export default function MentorMarketplacePage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [requests, setRequests] = useState<MentorshipRequestType[]>([]);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [userId, setUserId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [styleFilter, setStyleFilter] = useState('All');
  
  // Checkout modal states
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedProForRequest, setSelectedProForRequest] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, { rating: number; comment: string }>>({});
  const [submittingFeedbackId, setSubmittingFeedbackId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [proRes, reqRes, subRes] = await Promise.all([
        fetch('/api/professionals'),
        fetch('/api/mentorship?role=student'),
        fetch('/api/subscriptions?planType=student'),
      ]);

      if (proRes.ok) {
        const proData = await proRes.json();
        setProfessionals(proData);
      }
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData);
      }
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriptionActive(subData.subscription?.planKey === 'student-pro');
      }
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserId(profileData.userId);
      }
    } catch (e) {
      console.error('Failed to load marketplace data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useUserSocket(userId, {
    'mentorship:accepted': fetchData,
    'mentorship:rejected': fetchData,
    'mentorship:completed': fetchData,
    'mentorship:feedback': fetchData,
  });

  const handleRequestMentorship = async (professionalId: string) => {
    if (!subscriptionActive) {
      setSelectedProForRequest(professionalId);
      setShowPayModal(true);
      return;
    }

    try {
      const res = await fetch('/api/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professionalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');
      alert('Mentorship request sent successfully. You will be notified when the professional approves.');
      fetchData();
    } catch (e: any) {
      alert('Error sending request: ' + e.message);
    }
  };

  const startPayment = async () => {
    setProcessingPayment(true);
    try {
      const orderRes = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey: 'student-pro' }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to activate subscription');

      setSubscriptionActive(true);
      setShowPayModal(false);
      alert('Beginner Pro Plan activated. You can now request mentorship.');
      if (selectedProForRequest) {
        await handleRequestMentorship(selectedProForRequest);
      }
    } catch (e: any) {
      alert('Checkout error: ' + e.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getRequest = (proId: string) => requests.find((r) => r.professionalId === proId);

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
      fetchData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmittingFeedbackId(null);
    }
  };

  const filteredPros = professionals.filter((pro) => {
    const matchesSearch =
      pro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.professionalProfile.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.professionalProfile.brokerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStyle = styleFilter === 'All' || pro.professionalProfile.tradingStyle === styleFilter;
    return matchesSearch && matchesStyle;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#FDD458' }} />
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 className="profile-header-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Award size={28} style={{ color: '#FDD458' }} /> Mentor Marketplace
          </h1>
          <p style={{ color: '#9095A1', fontSize: 14, marginTop: 4 }}>
            Learn 1-on-1 from verified professional traders, see real portfolios, and enhance your strategies.
          </p>
        </div>
        <div style={{
          padding: '8px 16px',
          borderRadius: 999,
          background: subscriptionActive ? 'rgba(15,237,190,0.1)' : 'rgba(253,212,88,0.1)',
          border: subscriptionActive ? '1px solid rgba(15,237,190,0.3)' : '1px solid rgba(253,212,88,0.3)',
          color: subscriptionActive ? '#0FEDBE' : '#FDD458',
          fontSize: 13,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {subscriptionActive ? <><CheckCircle size={14} /> Beginner Pro Active</> : <><HelpCircle size={14} /> Beginner Pro Required</>}
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 24,
        background: '#0B0D10',
        padding: 16,
        borderRadius: 12,
        border: '1px solid #1E2229'
      }}>
        <div style={{ flex: 1, position: 'relative', minWidth: 260 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: '#9095A1' }} />
          <input
            type="text"
            placeholder="Search by name, broker, bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 42px',
              background: '#040507',
              border: '1px solid #30333A',
              borderRadius: 8,
              color: '#f5f5f5',
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#9095A1', fontWeight: 600 }}>Trading Style:</span>
          {['All', 'Intraday', 'Swing', 'Long Term'].map((style) => (
            <button
              key={style}
              onClick={() => setStyleFilter(style)}
              style={{
                padding: '8px 14px',
                background: styleFilter === style ? '#FDD458' : '#040507',
                color: styleFilter === style ? '#0A0A0A' : '#CCDADC',
                border: '1px solid #30333A',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Marketplace Grid */}
      {filteredPros.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0B0D10', borderRadius: 12, border: '1px solid #1E2229' }}>
          <Users size={40} style={{ color: '#525866', marginBottom: 12, display: 'inline-block' }} />
          <h3 style={{ color: '#CCDADC', fontSize: 16, fontWeight: 700 }}>No Mentors Found</h3>
          <p style={{ color: '#9095A1', fontSize: 14, marginTop: 4 }}>Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {filteredPros.map((pro) => {
            const request = getRequest(pro._id);
            const status = request?.status || null;
            return (
              <div
                key={pro._id}
                style={{
                  background: '#0B0D10',
                  border: '1px solid #1E2229',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  transition: 'transform 0.2s, border-color 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'rgba(253,212,88,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = '#1E2229';
                }}
              >
                {/* Pro Profile Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ color: '#f5f5f5', fontSize: 17, fontWeight: 700 }}>{pro.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: '#FDD458', background: 'rgba(253,212,88,0.1)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                        {pro.professionalProfile.tradingStyle}
                      </span>
                      <span style={{ fontSize: 12, color: '#9095A1' }}>
                        {pro.professionalProfile.experience} Yrs Exp
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#040507', padding: '4px 8px', borderRadius: 6, border: '1px solid #30333A' }}>
                    <Star size={13} fill="#FDD458" style={{ color: '#FDD458' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#CCDADC' }}>{pro.professionalProfile.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Bio */}
                <p style={{ color: '#9095A1', fontSize: 13, lineHeight: 1.5, flex: 1 }}>
                  {pro.professionalProfile.bio}
                </p>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px 0', borderTop: '1px solid #1E2229', borderBottom: '1px solid #1E2229' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: 11, color: '#9095A1' }}>Preferred Broker</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#CCDADC' }}>{pro.professionalProfile.brokerName}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: 11, color: '#9095A1' }}>Beginners Mentored</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#CCDADC' }}>{pro.professionalProfile.studentsCount || 0} active</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  {pro.professionalProfile.portfolioUrl && (
                    <a
                      href={pro.professionalProfile.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 13,
                        color: '#CCDADC',
                        fontWeight: 600,
                        textDecoration: 'underline',
                      }}
                    >
                      View Portfolio Proof
                    </a>
                  )}
                  
                  {status === 'accepted' || status === 'completed' ? (
                    <button
                      disabled
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'rgba(15,237,190,0.1)',
                        border: '1px solid rgba(15,237,190,0.3)',
                        color: '#0FEDBE',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {status === 'completed' ? 'Session Completed' : 'Approved Mentor'}
                    </button>
                  ) : status === 'pending' ? (
                    <button
                      disabled
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'rgba(253,212,88,0.05)',
                        border: '1px solid rgba(253,212,88,0.2)',
                        color: '#FDD458',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Request Pending
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRequestMentorship(pro._id)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#FDD458',
                        color: '#0A0A0A',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Request Mentorship
                    </button>
                  )}
                </div>

                {status === 'completed' && request && !request.feedbackSubmittedAt && (
                  <div style={{ background: '#040507', border: '1px solid #212328', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ color: '#CCDADC', fontSize: 12, fontWeight: 800 }}>Session Feedback</label>
                    <select
                      value={feedbackDrafts[request._id]?.rating || 5}
                      onChange={(e) =>
                        setFeedbackDrafts((drafts) => ({
                          ...drafts,
                          [request._id]: { rating: Number(e.target.value), comment: drafts[request._id]?.comment || '' },
                        }))
                      }
                      style={{ background: '#0B0D10', border: '1px solid #30333A', borderRadius: 6, color: '#CCDADC', padding: '8px 10px', fontSize: 12 }}
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>{rating} / 5</option>
                      ))}
                    </select>
                    <textarea
                      value={feedbackDrafts[request._id]?.comment || ''}
                      onChange={(e) =>
                        setFeedbackDrafts((drafts) => ({
                          ...drafts,
                          [request._id]: { rating: drafts[request._id]?.rating || 5, comment: e.target.value },
                        }))
                      }
                      placeholder="Share feedback for this completed session..."
                      rows={2}
                      style={{ background: '#0B0D10', border: '1px solid #30333A', borderRadius: 6, color: '#CCDADC', padding: '8px 10px', fontSize: 12, resize: 'vertical' }}
                    />
                    <button
                      onClick={() => submitFeedback(request._id)}
                      disabled={submittingFeedbackId === request._id}
                      style={{ width: 'fit-content', background: '#FDD458', border: 'none', borderRadius: 6, color: '#0A0A0A', padding: '8px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {submittingFeedbackId === request._id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
                      Submit Feedback
                    </button>
                  </div>
                )}

                {request?.feedbackSubmittedAt && (
                  <p style={{ color: '#0FEDBE', fontSize: 12, fontWeight: 800 }}>Feedback submitted for this session.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pay Modal Overlay */}
      {showPayModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#0B0D10',
            border: '1px solid #1E2229',
            borderRadius: 16,
            maxWidth: 420,
            width: '100%',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            position: 'relative'
          }}>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: '#f5f5f5', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={20} style={{ color: '#FDD458' }} /> Subscribe to Mentorship
            </h3>
            
            <p style={{ color: '#9095A1', fontSize: 14, lineHeight: 1.5 }}>
              Mentorship access requires the <strong style={{ color: '#CCDADC' }}>Beginner Pro Plan</strong>. For this MVP, purchase activates instantly with no payment gateway.
            </p>

            <div style={{ background: '#040507', border: '1px solid #212328', borderRadius: 8, padding: 14 }}>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#CCDADC' }}>
                <li style={{ display: 'flex', gap: 6 }}>Learn 1-on-1 from approved professionals</li>
                <li style={{ display: 'flex', gap: 6 }}>Gain insights from real portfolios</li>
                <li style={{ display: 'flex', gap: 6 }}>Step-by-step strategy reviews</li>
                <li style={{ display: 'flex', gap: 6 }}>Instant MVP activation</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button
                onClick={startPayment}
                disabled={processingPayment}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#FDD458',
                  color: '#0A0A0A',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {processingPayment ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Purchase Beginner Pro'}
              </button>
              <button
                onClick={() => setShowPayModal(false)}
                disabled={processingPayment}
                style={{
                  padding: '12px 18px',
                  background: 'transparent',
                  border: '1px solid #30333A',
                  color: '#9095A1',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
