'use client';

import { useState, useEffect } from 'react';
import { UniversalImport } from '@/components/portfolio/UniversalImport';
import { GrowwMCPConnect } from '@/components/portfolio/GrowwMCPConnect';
import NotificationCenter from '@/components/NotificationCenter';
import { User, ShieldAlert, Target, Save, CheckCircle2, Loader2, Award, GraduationCap, TrendingUp, Upload, ShieldCheck } from 'lucide-react';

type ProfessionalProfile = {
  experience?: number;
  tradingStyle?: 'Intraday' | 'Swing' | 'Long Term';
  brokerName?: string;
  portfolioUrl?: string;
  portfolioValue?: number;
  bio?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  rating?: number;
  studentsCount?: number;
};

type ProfileData = {
  userId?: string;
  riskTolerance?: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentGoals?: 'GROWTH' | 'INCOME' | 'PRESERVATION';
  role?: 'user' | 'professional';
  professionalProfile?: ProfessionalProfile | null;
};

type AcademyProfileSummary = {
  summary: {
    lessonsCompleted: number;
    totalLessons: number;
    courseCompletionPercent: number;
    currentBadge: string;
    unlockedBadges: string[];
    xpEarned: number;
  };
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [academy, setAcademy] = useState<AcademyProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Professional onboarding state
  const [applyProfessional, setApplyProfessional] = useState(false);
  const [exp, setExp] = useState('');
  const [style, setStyle] = useState('Swing');
  const [broker, setBroker] = useState('');
  const [portfolioVal, setPortfolioVal] = useState('');
  const [bioText, setBioText] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/portfolio/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setPortfolioUrl(data.url);
        alert("Portfolio file uploaded successfully!");
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to upload portfolio: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const submitApplication = async () => {
    if (!exp || !broker || !portfolioVal || !bioText) {
      alert("Please fill out all onboarding fields.");
      return;
    }
    setSubmittingApp(true);
    try {
      const res = await fetch("/api/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experience: exp,
          tradingStyle: style,
          brokerName: broker,
          portfolioUrl,
          portfolioValue: portfolioVal,
          bio: bioText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit application");
      
      // Reload profile to reflect approved state
      const profileRes = await fetch('/api/profile');
      const profileData = await profileRes.json();
      setProfile(profileData);
      alert("Professional profile approved and activated.");
    } catch (err: any) {
      console.error(err);
      alert("Application submission failed: " + err.message);
    } finally {
      setSubmittingApp(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, academyRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/academy'),
        ]);
        const profileData = await profileRes.json();
        setProfile(profileData);
        if (profileData.professionalProfile) {
          setExp(String(profileData.professionalProfile.experience || ''));
          setStyle(profileData.professionalProfile.tradingStyle || 'Swing');
          setBroker(profileData.professionalProfile.brokerName || '');
          setPortfolioVal(String(profileData.professionalProfile.portfolioValue || ''));
          setBioText(profileData.professionalProfile.bio || '');
          setPortfolioUrl(profileData.professionalProfile.portfolioUrl || '');
        }

        if (academyRes.ok) {
          const academyData = await academyRes.json();
          setAcademy(academyData);
        }
      } catch (e) {
        console.error('Failed to load profile', e);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskTolerance: profile?.riskTolerance,
          investmentGoals: profile?.investmentGoals,
        }),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save profile', e);
      alert('Failed to save profile preferences.');
    }
    setSaving(false);
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div className="profile-header-icon">
          <User className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#FDD458' }} />
        </div>
        <div>
          <h1 className="profile-header-title">
            Investor Profile
          </h1>
          <p style={{ color: '#9095A1', fontSize: 14 }}>
            Set your financial preferences to personalize the AI Assistant, and manage your portfolio data.
          </p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Profile Settings */}
        <div className="profile-card">
          <h2 style={{ color: '#f5f5f5', fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} style={{ color: '#FDD458' }} /> Preferences
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#CCDADC', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                <ShieldAlert size={14} /> Risk Tolerance
              </label>
              <select 
                value={profile?.riskTolerance || 'MEDIUM'}
                onChange={(e) => setProfile({ ...profile, riskTolerance: e.target.value as any })}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0A', border: '1px solid #30333A', borderRadius: 8, color: '#f5f5f5', fontSize: 14, outline: 'none' }}
              >
                <option value="LOW">Low (Conservative)</option>
                <option value="MEDIUM">Medium (Moderate)</option>
                <option value="HIGH">High (Aggressive)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#CCDADC', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                <Target size={14} /> Investment Goal
              </label>
              <select 
                value={profile?.investmentGoals || 'GROWTH'}
                onChange={(e) => setProfile({ ...profile, investmentGoals: e.target.value as any })}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0A', border: '1px solid #30333A', borderRadius: 8, color: '#f5f5f5', fontSize: 14, outline: 'none' }}
              >
                <option value="GROWTH">Growth (Capital Appreciation)</option>
                <option value="INCOME">Income (Dividends & Yield)</option>
                <option value="PRESERVATION">Preservation (Capital Protection)</option>
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <button
                onClick={saveProfile}
                disabled={saving}
                style={{
                  padding: '10px 20px', borderRadius: 8,
                  background: saved ? 'rgba(15,237,190,0.1)' : 'rgba(253,212,88,0.1)',
                  border: saved ? '1px solid rgba(15,237,190,0.3)' : '1px solid rgba(253,212,88,0.3)',
                  color: saved ? '#0FEDBE' : '#FDD458', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                }}
              >
                {saved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save Preferences'}</>}
              </button>
            </div>
          </div>
        </div>

        {/* Academy Progress */}
        <div className="profile-card">
          <h2 style={{ color: '#f5f5f5', fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GraduationCap size={18} style={{ color: '#FDD458' }} /> Academy Progress
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 18 }}>
            <div style={{ padding: 14, background: '#0A0A0A', border: '1px solid #212328', borderRadius: 12 }}>
              <p style={{ color: '#9095A1', fontSize: 12, fontWeight: 700 }}>Current Badge</p>
              <p style={{ color: '#FDD458', fontSize: 16, fontWeight: 800, marginTop: 6 }}>{academy?.summary.currentBadge ?? 'Beginner Investor'}</p>
            </div>
            <div style={{ padding: 14, background: '#0A0A0A', border: '1px solid #212328', borderRadius: 12 }}>
              <p style={{ color: '#9095A1', fontSize: 12, fontWeight: 700 }}>Completion</p>
              <p style={{ color: '#0FEDBE', fontSize: 16, fontWeight: 800, marginTop: 6 }}>{academy?.summary.courseCompletionPercent ?? 0}%</p>
            </div>
            <div style={{ padding: 14, background: '#0A0A0A', border: '1px solid #212328', borderRadius: 12 }}>
              <p style={{ color: '#9095A1', fontSize: 12, fontWeight: 700 }}>XP Earned</p>
              <p style={{ color: '#CCDADC', fontSize: 16, fontWeight: 800, marginTop: 6 }}>{academy?.summary.xpEarned?.toLocaleString('en-IN') ?? 0}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['Beginner Investor', 'Smart Investor', 'Market Analyst'].map((badge) => {
              const unlocked = academy?.summary.unlockedBadges.includes(badge);
              return (
                <span
                  key={badge}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 999,
                    background: unlocked ? 'rgba(253,212,88,0.1)' : '#0A0A0A',
                    border: unlocked ? '1px solid rgba(253,212,88,0.3)' : '1px solid #212328',
                    color: unlocked ? '#FDD458' : '#9095A1',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  <Award size={14} /> {badge}
                </span>
              );
            })}
          </div>
        </div>

        {/* Professional Trader Program Card */}
        <div className="profile-card col-span-1 md:col-span-2">
          <h2 style={{ color: '#f5f5f5', fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} style={{ color: '#FDD458' }} /> Professional Trader Program
          </h2>

          {profile?.role === 'professional' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {profile.professionalProfile?.verificationStatus === 'pending' && (
                <div style={{ padding: 14, borderRadius: 8, background: 'rgba(253,212,88,0.1)', border: '1px solid rgba(253,212,88,0.3)', color: '#FDD458', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <ShieldAlert size={18} />
                  <div>
                    <strong style={{ display: 'block', fontSize: 14 }}>Application Under Review</strong>
                    <span style={{ fontSize: 13, color: '#9095A1' }}>Our team is verifying your portfolio. You will become visible in the marketplace once approved.</span>
                  </div>
                </div>
              )}

              {profile.professionalProfile?.verificationStatus === 'approved' && (
                <div style={{ padding: 14, borderRadius: 8, background: 'rgba(15,237,190,0.1)', border: '1px solid rgba(15,237,190,0.3)', color: '#0FEDBE', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <ShieldCheck size={18} />
                  <div>
                    <strong style={{ display: 'block', fontSize: 14 }}>Verified Professional Trader</strong>
                    <span style={{ fontSize: 13, color: '#CCDADC' }}>Congratulations! You are an approved mentor. You can access your workspace dashboard below.</span>
                  </div>
                </div>
              )}

              {profile.professionalProfile?.verificationStatus === 'rejected' && (
                <div style={{ padding: 14, borderRadius: 8, background: 'rgba(255,73,91,0.1)', border: '1px solid rgba(255,73,91,0.3)', color: '#FF495B', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <ShieldAlert size={18} />
                  <div>
                    <strong style={{ display: 'block', fontSize: 14 }}>Application Rejected</strong>
                    <span style={{ fontSize: 13, color: '#9095A1' }}>Your portfolio did not meet our verification criteria. Feel free to update details and re-apply.</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 8 }}>
                <div style={{ padding: 12, background: '#0A0A0A', border: '1px solid #212328', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: '#9095A1', display: 'block' }}>Experience</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#CCDADC' }}>{profile.professionalProfile?.experience} Years</span>
                </div>
                <div style={{ padding: 12, background: '#0A0A0A', border: '1px solid #212328', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: '#9095A1', display: 'block' }}>Trading Style</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#CCDADC' }}>{profile.professionalProfile?.tradingStyle}</span>
                </div>
                <div style={{ padding: 12, background: '#0A0A0A', border: '1px solid #212328', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: '#9095A1', display: 'block' }}>Broker</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#CCDADC' }}>{profile.professionalProfile?.brokerName}</span>
                </div>
                <div style={{ padding: 12, background: '#0A0A0A', border: '1px solid #212328', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: '#9095A1', display: 'block' }}>Active Beginners</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0FEDBE' }}>{profile.professionalProfile?.studentsCount || 0}</span>
                </div>
              </div>

              {profile.professionalProfile?.verificationStatus === 'approved' && (
                <div style={{ marginTop: 12 }}>
                  <a
                    href="/professional/dashboard"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '10px 20px',
                      background: '#FDD458',
                      color: '#0A0A0A',
                      borderRadius: 8,
                      fontWeight: 700,
                      textDecoration: 'none',
                      fontSize: 14,
                    }}
                  >
                    Open Professional Dashboard
                  </a>
                </div>
              )}

              {profile.professionalProfile?.verificationStatus === 'rejected' && (
                <button
                  onClick={() => {
                    setProfile({ ...profile, role: 'user' as any });
                    setApplyProfessional(true);
                  }}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '8px 16px',
                    background: 'rgba(253,212,88,0.1)',
                    border: '1px solid rgba(253,212,88,0.3)',
                    color: '#FDD458',
                    borderRadius: 8,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Update & Re-apply
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!applyProfessional ? (
                <div>
                  <p style={{ color: '#9095A1', fontSize: 14, marginBottom: 16 }}>
                    Monetize your trading expertise by offering 1-on-1 mentorship to other users. Apply to become a verified Professional Trader on FinNext.
                  </p>
                  <button
                    onClick={() => setApplyProfessional(true)}
                    style={{
                      padding: '10px 20px',
                      background: 'rgba(253,212,88,0.1)',
                      border: '1px solid rgba(253,212,88,0.3)',
                      color: '#FDD458',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    Apply Now
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', color: '#CCDADC', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        Years of Trading Experience
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={exp}
                        onChange={(e) => setExp(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', background: '#0A0A0A', border: '1px solid #30333A', borderRadius: 8, color: '#f5f5f5', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#CCDADC', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        Trading Style
                      </label>
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', background: '#0A0A0A', border: '1px solid #30333A', borderRadius: 8, color: '#f5f5f5', fontSize: 14, outline: 'none' }}
                      >
                        <option value="Intraday">Intraday</option>
                        <option value="Swing">Swing</option>
                        <option value="Long Term">Long Term</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', color: '#CCDADC', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        Broker Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Zerodha, Groww"
                        value={broker}
                        onChange={(e) => setBroker(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', background: '#0A0A0A', border: '1px solid #30333A', borderRadius: 8, color: '#f5f5f5', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#CCDADC', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        Portfolio Size (INR)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 500000"
                        value={portfolioVal}
                        onChange={(e) => setPortfolioVal(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', background: '#0A0A0A', border: '1px solid #30333A', borderRadius: 8, color: '#f5f5f5', fontSize: 14, outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#CCDADC', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      Trading Bio / Description
                    </label>
                    <textarea
                      placeholder="Describe your strategy, performance history, or mentorship focus..."
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: '10px 14px', background: '#0A0A0A', border: '1px solid #30333A', borderRadius: 8, color: '#f5f5f5', fontSize: 14, outline: 'none', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#CCDADC', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      Upload Portfolio Proof (CSV, PDF, or Screenshot)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        style={{ display: 'none' }}
                        id="portfolio-upload"
                      />
                      <label
                        htmlFor="portfolio-upload"
                        style={{
                          padding: '10px 16px',
                          background: '#0A0A0A',
                          border: '1px dashed #30333A',
                          borderRadius: 8,
                          color: '#CCDADC',
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Upload size={14} /> {uploading ? 'Uploading...' : 'Choose File'}
                      </label>
                      {portfolioUrl && (
                        <span style={{ color: '#0FEDBE', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={14} /> File uploaded!
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button
                      onClick={submitApplication}
                      disabled={submittingApp}
                      style={{
                        padding: '10px 20px',
                        background: '#FDD458',
                        border: 'none',
                        color: '#0A0A0A',
                        borderRadius: 8,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      {submittingApp ? 'Submitting...' : 'Submit Application'}
                    </button>
                    <button
                      onClick={() => setApplyProfessional(false)}
                      style={{
                        padding: '10px 20px',
                        background: 'transparent',
                        border: '1px solid #30333A',
                        color: '#9095A1',
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {profile?.role === 'professional' && (
          <div className="profile-card col-span-1 md:col-span-2">
            <NotificationCenter userId={profile.userId} professional />
          </div>
        )}

        {/* Groww MCP Connection */}
        <GrowwMCPConnect />

        {/* Portfolio Import */}
        {/* Portfolio Import */}
        <UniversalImport />
      </div>
    </div>
  );
}
