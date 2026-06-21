'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2, User, Mail, Calendar, CheckCircle2, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useUserSocket } from '@/hooks/useUserSocket';

type Student = {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'accepted' | 'completed';
  demoSessionLink?: string;
  completedAt?: string;
  growwCouponCode?: string;
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackSubmittedAt?: string;
  createdAt: string;
};

export default function ProfessionalStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [userId, setUserId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/mentorship?role=professional');
      if (res.ok) {
        const data = await res.json();
        const activeStudents = data.filter((req: any) => ['accepted', 'completed'].includes(req.status));
        setStudents(activeStudents);
      }
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setUserId(profile.userId);
      }
    } catch (e) {
      console.error('Failed to load active beginners', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useUserSocket(userId, {
    'mentorship:accepted': fetchStudents,
    'mentorship:rejected': fetchStudents,
    'mentorship:completed': fetchStudents,
    'mentorship:feedback': fetchStudents,
  });

  const markAsComplete = async (requestId: string) => {
    setCompletingId(requestId);
    try {
      const res = await fetch('/api/mentorship', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'complete' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete session');
      fetchStudents();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#FDD458' }} />
      </div>
    );
  }

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
          <Users size={28} style={{ color: '#FDD458' }} /> My Beginners
        </h1>
        <p style={{ color: '#9095A1', fontSize: 14, marginTop: 4 }}>
          A list of all beginners currently enrolled in your mentorship program.
        </p>
      </div>

      {/* Students List Card */}
      <div style={{ background: '#0B0D10', border: '1px solid #1E2229', borderRadius: 12, padding: 20 }}>
        <h2 style={{ color: '#f5f5f5', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Enrolled Beginners ({students.length})</h2>

        {students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Users size={32} style={{ color: '#525866', marginBottom: 8, display: 'inline-block' }} />
            <p style={{ color: '#9095A1', fontSize: 14 }}>You don't have any active beginners yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {students.map((student) => (
              <div
                key={student._id}
                style={{
                  background: '#040507',
                  border: '1px solid #212328',
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ background: 'rgba(15,237,190,0.1)', padding: 10, borderRadius: 8, color: '#0FEDBE' }}>
                    <User size={18} />
                  </div>
                  <div>
                    <strong style={{ color: '#CCDADC', fontSize: 14, display: 'block' }}>{student.studentId?.name || 'Anonymous Beginner'}</strong>
                    <span style={{ color: '#9095A1', fontSize: 12, display: 'block', marginTop: 1 }}>Active Beginner</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid #1E2229', paddingTop: 10, fontSize: 12, color: '#9095A1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={12} />
                    <span>{student.studentId?.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={12} />
                    <span>Enrolled: {new Date(student.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  {student.demoSessionLink && (
                    <a
                      href={student.demoSessionLink}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#FDD458', fontWeight: 800, textDecoration: 'none' }}
                    >
                      Demo Session Link
                    </a>
                  )}
                  {student.status === 'accepted' && student.demoSessionLink && (
                    <button
                      onClick={() => markAsComplete(student._id)}
                      disabled={completingId === student._id}
                      style={{
                        width: 'fit-content',
                        marginTop: 4,
                        padding: '8px 10px',
                        background: '#0FEDBE',
                        border: 'none',
                        borderRadius: 6,
                        color: '#0A0A0A',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {completingId === student._id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={13} />}
                      Mark as Complete
                    </button>
                  )}
                  {student.status === 'completed' && student.growwCouponCode && (
                    <div style={{ marginTop: 4, padding: 10, border: '1px solid rgba(15,237,190,0.25)', borderRadius: 8, background: 'rgba(15,237,190,0.08)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0FEDBE', fontSize: 12, fontWeight: 800 }}>
                        <Ticket size={13} /> Groww Coupon
                      </span>
                      <code style={{ display: 'block', marginTop: 5, color: '#CCDADC', fontSize: 13 }}>{student.growwCouponCode}</code>
                      {student.feedbackSubmittedAt && (
                        <span style={{ display: 'block', marginTop: 6, color: '#9095A1', fontSize: 11 }}>
                          Feedback: {student.feedbackRating}/5 {student.feedbackComment ? `- ${student.feedbackComment}` : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
