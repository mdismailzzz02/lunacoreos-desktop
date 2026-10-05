import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Phone, Users, MessageSquare, RefreshCw, Smartphone } from 'lucide-react';

export default function PhoneSyncPage() {
    const [activeTab, setActiveTab] = useState('calls');
    const [calls, setCalls] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [sms, setSms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [callsRes, contactsRes, smsRes] = await Promise.all([
                supabase.from('phone_call_logs').select('*').order('timestamp', { ascending: false }).limit(200),
                supabase.from('phone_contacts').select('*').order('display_name', { ascending: true }),
                supabase.from('phone_sms').select('*').order('timestamp', { ascending: false }).limit(200).catch(() => ({ data: [] }))
            ]);

            if (callsRes.error) throw callsRes.error;
            if (contactsRes.error) throw contactsRes.error;
            
            setCalls(callsRes.data || []);
            setContacts(contactsRes.data || []);
            setSms(smsRes?.data || []);
        } catch (err) {
            console.error('Error loading phone sync data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const formatDuration = (seconds) => {
        if (!seconds) return '0s';
        const s = parseInt(seconds);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
        if (m > 0) return `${m}m ${s % 60}s`;
        return `${s}s`;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown date';
        // Handle both string timestamps from Android and regular timestamps
        const d = new Date(parseInt(timestamp));
        return isNaN(d.getTime()) ? new Date(timestamp).toLocaleString() : d.toLocaleString();
    };

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div className="page-header" style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#3b82f6' }}>
                            <Smartphone size={28} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Phone Sync</h1>
                            <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                                View your Android device's synced call logs, contacts, and SMS
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={loadData}
                        disabled={loading}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.5 : 1
                        }}
                    >
                        <RefreshCw size={16} className={loading ? 'spin' : ''} />
                        Refresh
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    {[
                        { id: 'calls', icon: Phone, label: 'Call Logs', count: calls.length },
                        { id: 'contacts', icon: Users, label: 'Contacts', count: contacts.length },
                        { id: 'sms', icon: MessageSquare, label: 'Messages', count: sms.length }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            style={{
                                background: activeTab === t.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                color: activeTab === t.id ? '#3b82f6' : 'rgba(255,255,255,0.6)',
                                border: `1px solid ${activeTab === t.id ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                                padding: '10px 20px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: activeTab === t.id ? 'bold' : 'normal'
                            }}
                        >
                            <t.icon size={18} />
                            {t.label}
                            <span style={{ 
                                background: activeTab === t.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.1)',
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '12px',
                                marginLeft: '4px'
                            }}>
                                {t.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>
                        <RefreshCw size={24} className="spin" />
                    </div>
                ) : error ? (
                    <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px' }}>
                        Error: {error}
                    </div>
                ) : (
                    <>
                        {activeTab === 'calls' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {calls.map(call => (
                                    <div key={call.id} style={{ 
                                        background: 'rgba(255,255,255,0.03)', 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        padding: '16px', 
                                        borderRadius: '12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                                                {call.cached_name || call.number || 'Unknown'}
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' }}>
                                                <span style={{ color: call.type === '1' ? '#3b82f6' : call.type === '2' ? '#22c55e' : call.type === '3' ? '#ef4444' : 'inherit' }}>
                                                    {call.type === '1' ? '↓ Incoming' : call.type === '2' ? '↑ Outgoing' : call.type === '3' ? '✖ Missed' : 'Unknown'}
                                                </span>
                                                <span>•</span>
                                                <span>{formatDate(call.timestamp)}</span>
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', fontSize: '14px' }}>
                                            {formatDuration(call.duration_seconds)}
                                        </div>
                                    </div>
                                ))}
                                {calls.length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)' }}>No call logs synced yet.</div>}
                            </div>
                        )}

                        {activeTab === 'contacts' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                {contacts.map(contact => (
                                    <div key={contact.id} style={{ 
                                        background: 'rgba(255,255,255,0.03)', 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        padding: '20px', 
                                        borderRadius: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ 
                                                width: '40px', height: '40px', 
                                                borderRadius: '50%', 
                                                background: 'rgba(59, 130, 246, 0.2)', 
                                                color: '#3b82f6',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '18px', fontWeight: 'bold'
                                            }}>
                                                {contact.display_name ? contact.display_name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{contact.display_name || 'Unnamed'}</div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                                            {(contact.phones || []).map((p, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Phone size={14} style={{ opacity: 0.5 }} /> {p}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {contacts.length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)' }}>No contacts synced yet.</div>}
                            </div>
                        )}

                        {activeTab === 'sms' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {sms.map(msg => (
                                    <div key={msg.id || msg.msg_id} style={{ 
                                        background: 'rgba(255,255,255,0.03)', 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        padding: '16px', 
                                        borderRadius: '12px',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div style={{ fontWeight: 'bold', color: msg.type === '1' ? '#3b82f6' : '#22c55e' }}>
                                                {msg.type === '1' ? '↓ From:' : '↑ To:'} {msg.address}
                                            </div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                                                {formatDate(msg.timestamp || msg.date)}
                                            </div>
                                        </div>
                                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                                            {msg.body}
                                        </div>
                                    </div>
                                ))}
                                {sms.length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)' }}>No SMS synced yet.</div>}
                            </div>
                        )}
                    </>
                )}
            </div>
            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
