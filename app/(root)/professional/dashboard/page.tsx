'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, CalendarClock, Check, ChevronRight, ClipboardList, DollarSign, Loader2, Star, Users, X } from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter';
import { useUserSocket } from '@/hooks/useUserSocket';
import { PLAN_DEFINITIONS } from '@/lib/plans';

type StudentRequest = {
  _id: string;
  studentId: { _id: string; name: string; email: string };
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  demoSessionLink?: string;
  growwCouponCode?: string;
  createdAt: string;
};

type ProStats = {
  userId: string;
  rating: number;
  totalStudents: number;
  pendingRequests: number;
  acceptedRequests: number;
  rejectedRequests: number;
  currentPlan: string;
  totalEarnings: number;
  professionalEarnings: number;
};

export default function ProfessionalDashboardPage() {
  const [stats, setStats] = useState<ProStats | null>(null);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const todaySessionLabel = `${new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} at 8:00 PM`;

  const fetchDashboard = async () => {
    try {
      const [profileRes, requestRes, subRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/mentorship?role=professional'),
        fetch('/api/subscriptions?planType=professional'),
      ]);

      if (!profileRes.ok) return;
      const profile = await profileRes.json();
      if (profile.role !== 'professional') {
        window.location.href = '/profile';
        return;
      }

      const requestData: StudentRequest[] = requestRes.ok ? await requestRes.json() : [];
      const subscriptionData = subRes.ok ? await subRes.json() : {};
      const mentoredRequests = requestData.filter((req) => ['accepted', 'completed'].includes(req.status)).length;
      const acceptedRequests = requestData.filter((req) => req.status === 'accepted').length;
      const totalEarnings = mentoredRequests * (PLAN_DEFINITIONS['student-pro'].amount / 2);

      setRequests(requestData);
      setStats({
        userId: profile.userId,
        rating: profile.professionalProfile?.rating || 5.0,
        totalStudents: mentoredRequests,
        pendingRequests: requestData.filter((req) => req.status === 'pending').length,
        acceptedRequests,
        rejectedRequests: requestData.filter((req) => req.status === 'rejected').length,
        currentPlan: subscriptionData.subscription?.plan || 'No professional plan',
        totalEarnings,
        professionalEarnings: totalEarnings,
      });
    } catch (error) {
      console.error('Failed to load professional dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useUserSocket(stats?.userId, {
    'mentorship:created': fetchDashboard,
    'mentorship:accepted': fetchDashboard,
    'mentorship:rejected': fetchDashboard,
    'mentorship:completed': fetchDashboard,
    'mentorship:feedback': fetchDashboard,
  });

  const handleAction = async (requestId: string, action: 'accept' | 'reject' | 'complete') => {
    setUpdatingId(requestId);
    try {
      const res = await fetch('/api/mentorship', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update request');
      fetchDashboard();
    } catch (error: any) {
      alert(error.message);
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

  const pendingRequests = requests.filter((req) => req.status === 'pending');
  const todaySessions = requests.filter((req) => req.status === 'accepted');

  return (
    <div className="profile-container">
      <div style={{ marginBottom: 24 }}>
        <h1 className="profile-header-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Award size={28} style={{ color: '#FDD458' }} /> Professional Workspace
        </h1>
        <p style={{ color: '#9095A1', fontSize: 14, marginTop: 4 }}>
          Manage mentorship requests, active beginners, plan status, and notifications.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Beginners', value: stats?.totalStudents ?? 0, icon: Users, color: '#0FEDBE' },
          { label: 'Pending Requests', value: stats?.pendingRequests ?? 0, icon: ClipboardList, color: '#FDD458' },
          { label: 'Accepted Requests', value: stats?.acceptedRequests ?? 0, icon: Check, color: '#0FEDBE' },
          { label: 'Rejected Requests', value: stats?.rejectedRequests ?? 0, icon: X, color: '#FF495B' },
          { label: 'Current Plan', value: stats?.currentPlan ?? 'No plan', icon: Star, color: '#FDD458' },
          { label: 'Total Earnings', value: `Rs. ${(stats?.professionalEarnings ?? 0).toLocaleString('en-IN')}`, icon: DollarSign, color: '#CCDADC' },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} style={{ background: '#0B0D10', border: '1px solid #1E2229', borderRadius: 8, padding: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ background: 'rgba(253,212,88,0.08)', padding: 10, borderRadius: 8, color: metric.color }}>
                <Icon size={19} />
              </div>
              <div>
                <span style={{ fontSize: 12, color: '#9095A1', display: 'block' }}>{metric.label}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#f5f5f5', marginTop: 4, display: 'block' }}>{metric.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div style={{ background: '#0B0D10', border: '1px solid #1E2229', borderRadius: 8, padding: 20 }}>
          <h2 style={{ color: '#f5f5f5', fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Pending Requests</h2>
          {pendingRequests.length === 0 ? (
            <p style={{ color: '#9095A1', fontSize: 13 }}>No pending mentorship requests.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingRequests.slice(0, 5).map((request) => (
                <div key={request._id} style={{ background: '#040507', border: '1px solid #212328', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#CCDADC', fontSize: 13, display: 'block' }}>{request.studentId?.name || 'Beginner'}</strong>
                    <span style={{ color: '#9095A1', fontSize: 11 }}>{new Date(request.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleAction(request._id, 'accept')} disabled={!!updatingId} style={{ padding: '7px 10px', background: '#0FEDBE', border: 'none', color: '#0A0A0A', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}>
                      {updatingId === request._id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Accept'}
                    </button>
                    <button onClick={() => handleAction(request._id, 'reject')} disabled={!!updatingId} style={{ padding: '7px 10px', background: 'transparent', border: '1px solid #FF495B', color: '#FF495B', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link href="/professional/requests" style={{ color: '#FDD458', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
            Open all requests <ChevronRight size={14} />
          </Link>
        </div>

        <div style={{ background: '#0B0D10', border: '1px solid #1E2229', borderRadius: 8, padding: 20 }}>
          <h2 style={{ color: '#f5f5f5', fontSize: 16, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarClock size={17} style={{ color: '#FDD458' }} /> Today Session
          </h2>
          {todaySessions.length === 0 ? (
            <p style={{ color: '#9095A1', fontSize: 13 }}>No accepted sessions scheduled for today at 8:00 PM.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {todaySessions.map((session) => (
                <div key={session._id} style={{ background: '#040507', border: '1px solid #212328', borderRadius: 8, padding: 12 }}>
                  <strong style={{ color: '#CCDADC', fontSize: 13, display: 'block' }}>{session.studentId?.name || 'Beginner'}</strong>
                  <span style={{ color: '#9095A1', fontSize: 12, display: 'block', marginTop: 4 }}>{todaySessionLabel}</span>
                  {session.demoSessionLink && (
                    <a href={session.demoSessionLink} target="_blank" rel="noreferrer" style={{ color: '#FDD458', fontSize: 12, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', marginTop: 8 }}>
                      Demo Google Meet Link
                    </a>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <button
                      onClick={() => handleAction(session._id, 'complete')}
                      disabled={!!updatingId}
                      style={{ padding: '8px 11px', background: '#0FEDBE', border: 'none', color: '#0A0A0A', borderRadius: 6, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {updatingId === session._id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                      Mark as Completed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <NotificationCenter userId={stats?.userId} professional />
      </div>
    </div>
  );
}
