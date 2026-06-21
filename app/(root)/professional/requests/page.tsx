'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Loader2, Check, X, User } from 'lucide-react';
import Link from 'next/link';
import { useUserSocket } from '@/hooks/useUserSocket';

type StudentRequest = {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
};

export default function ProfessionalRequestsPage() {
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [userId, setUserId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/mentorship?role=professional');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setUserId(profile.userId);
      }
    } catch (e) {
      console.error('Failed to load incoming requests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useUserSocket(userId, {
    'mentorship:created': fetchRequests,
    'mentorship:accepted': fetchRequests,
    'mentorship:rejected': fetchRequests,
    'mentorship:completed': fetchRequests,
  });

  const handleAction = async (requestId: string, action: 'accept' | 'reject') => {
    setUpdatingId(requestId);
    try {
      const res = await fetch('/api/mentorship', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update request');
      alert(`Mentorship request ${action === 'accept' ? 'accepted' : 'rejected'} successfully.`);
      fetchRequests();
    } catch (e: any) {
      alert('Error updating request: ' + e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#FDD458' }} />
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const pastRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="profile-container">
      {/* Breadcrumb */}
      <div style={{ marginBottom: 12 }}>
        <Link href="/professional/dashboard" style={{ color: '#FDD458', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
          ← Back to Workspace
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="profile-header-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ClipboardList size={28} style={{ color: '#FDD458' }} /> Mentorship Requests
        </h1>
        <p style={{ color: '#9095A1', fontSize: 14, marginTop: 4 }}>
          Review pending requests from beginners who want to learn from you.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Pending Requests Section */}
        <div style={{ background: '#0B0D10', border: '1px solid #1E2229', borderRadius: 12, padding: 20 }}>
          <h2 style={{ color: '#f5f5f5', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Pending Requests ({pendingRequests.length})</h2>

          {pendingRequests.length === 0 ? (
            <p style={{ color: '#9095A1', fontSize: 14 }}>No pending requests at the moment.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {pendingRequests.map((req) => (
                <div
                  key={req._id}
                  style={{
                    background: '#040507',
                    border: '1px solid #212328',
                    borderRadius: 8,
                    padding: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 14,
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ background: 'rgba(253,212,88,0.1)', padding: 10, borderRadius: 8, color: '#FDD458' }}>
                      <User size={18} />
                    </div>
                    <div>
                      <strong style={{ color: '#CCDADC', fontSize: 14, display: 'block' }}>{req.studentId?.name || 'Anonymous Beginner'}</strong>
                      <span style={{ color: '#9095A1', fontSize: 12, display: 'block', marginTop: 2 }}>{req.studentId?.email}</span>
                      <span style={{ color: '#525866', fontSize: 11, display: 'block', marginTop: 4 }}>
                        Requested: {new Date(req.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => handleAction(req._id, 'accept')}
                      disabled={updatingId !== null}
                      style={{
                        padding: '8px 16px',
                        background: '#0FEDBE',
                        color: '#0A0A0A',
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {updatingId === req._id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><Check size={14} /> Accept</>}
                    </button>
                    <button
                      onClick={() => handleAction(req._id, 'reject')}
                      disabled={updatingId !== null}
                      style={{
                        padding: '8px 16px',
                        background: 'transparent',
                        border: '1px solid #FF495B',
                        color: '#FF495B',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Request History Section */}
        <div style={{ background: '#0B0D10', border: '1px solid #1E2229', borderRadius: 12, padding: 20 }}>
          <h2 style={{ color: '#f5f5f5', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Request History ({pastRequests.length})</h2>

          {pastRequests.length === 0 ? (
            <p style={{ color: '#9095A1', fontSize: 14 }}>No past requests found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pastRequests.map((req) => (
                <div
                  key={req._id}
                  style={{
                    background: '#040507',
                    border: '1px solid #1E2229',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div>
                    <span style={{ color: '#CCDADC', fontSize: 13, fontWeight: 600 }}>{req.studentId?.name || 'Anonymous Beginner'}</span>
                    <span style={{ color: '#9095A1', fontSize: 11, display: 'block', marginTop: 2 }}>{req.studentId?.email}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: ['accepted', 'completed'].includes(req.status) ? '#0FEDBE' : '#FF495B',
                      background: ['accepted', 'completed'].includes(req.status) ? 'rgba(15,237,190,0.1)' : 'rgba(255,73,91,0.1)',
                      padding: '4px 10px',
                      borderRadius: 4,
                    }}
                  >
                    {req.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
