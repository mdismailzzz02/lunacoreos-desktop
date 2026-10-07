import React, { useState, useEffect } from 'react';
import { DollarSign, Sparkles, TrendingUp, Wallet, PiggyBank, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getGlobalAiContext } from '../../services/api';
import { askFinancialAdvice } from '../../services/gemini';

export default function FinancialAdvisor() {
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [contextLoading, setContextLoading] = useState(true);
    const [financeSummary, setFinanceSummary] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [error, setError] = useState('');

    // Load financial snapshot on mount
    useEffect(() => {
        loadFinanceSummary();
    }, []);

    const loadFinanceSummary = async () => {
        setContextLoading(true);
        try {
            const ctx = await getGlobalAiContext();
            const finance = ctx.finance || { accounts: [], budgets: [], goals: [] };

            const totalBalance = finance.accounts.reduce((sum, a) => sum + (parseFloat(a.current_balance) || 0), 0);
            const totalGoalTarget = finance.goals.reduce((sum, g) => sum + (parseFloat(g.target_amount) || 0), 0);
            const totalGoalCurrent = finance.goals.reduce((sum, g) => sum + (parseFloat(g.current_amount) || 0), 0);
            const goalProgress = totalGoalTarget > 0 ? Math.round((totalGoalCurrent / totalGoalTarget) * 100) : 0;

            setFinanceSummary({
                accountCount: finance.accounts.length,
                totalBalance,
                budgetCount: finance.budgets.length,
                goalCount: finance.goals.length,
                goalProgress,
                currency: finance.accounts[0]?.currency || 'INR',
            });
        } catch (err) {
            console.error("Failed to load finance summary:", err);
        } finally {
            setContextLoading(false);
        }
    };

    const handleAsk = async () => {
        if (!question.trim()) return;
        const userQ = question.trim();
        setQuestion('');
        setChatHistory(prev => [...prev, { role: 'user', content: userQ }]);
        setLoading(true);
        setError('');

        try {
            const globalContext = await getGlobalAiContext();
            const apiKey = import.meta.env.VITE_GROQ_API_KEY;
            const prevMessages = chatHistory.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
            const response = await askFinancialAdvice(apiKey, userQ, globalContext, prevMessages);
            setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (err) {
            console.error("Financial advice failed:", err);
            setError(err.message || 'Failed to get financial advice.');
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const QUICK_PROMPTS = [
        { icon: TrendingUp, label: "Am I on track with my financial goals?" },
        { icon: Wallet, label: "Where can I cut spending this month?" },
        { icon: PiggyBank, label: "How should I prioritize my savings?" },
        { icon: DollarSign, label: "Give me a full financial health checkup" },
    ];

    return (
        <div className="fa-advisor">
            {/* ─── Snapshot Cards ─── */}
            {!contextLoading && financeSummary && (
                <div className="fa-snapshot-strip">
                    <div className="fa-snapshot-card">
                        <Wallet size={16} />
                        <div>
                            <div className="fa-snap-label">Total Balance</div>
                            <div className="fa-snap-value">
                                {financeSummary.currency} {financeSummary.totalBalance.toLocaleString()}
                            </div>
                        </div>
                    </div>
                    <div className="fa-snapshot-card">
                        <DollarSign size={16} />
                        <div>
                            <div className="fa-snap-label">Accounts</div>
                            <div className="fa-snap-value">{financeSummary.accountCount}</div>
                        </div>
                    </div>
                    <div className="fa-snapshot-card">
                        <PiggyBank size={16} />
                        <div>
                            <div className="fa-snap-label">Goal Progress</div>
                            <div className="fa-snap-value">{financeSummary.goalProgress}%</div>
                        </div>
                    </div>
                    <div className="fa-snapshot-card">
                        <TrendingUp size={16} />
                        <div>
                            <div className="fa-snap-label">Budgets</div>
                            <div className="fa-snap-value">{financeSummary.budgetCount} active</div>
                        </div>
                    </div>
                </div>
            )}

            {contextLoading && (
                <div className="fa-snapshot-strip">
                    <div className="fa-skeleton-card" />
                    <div className="fa-skeleton-card" />
                    <div className="fa-skeleton-card" />
                    <div className="fa-skeleton-card" />
                </div>
            )}

            {/* ─── Quick Prompts ─── */}
            {chatHistory.length === 0 && (
                <div className="fa-quick-section">
                    <div className="fa-quick-header">
                        <Sparkles size={16} color="var(--accent)" />
                        <span>Ask your financial advisor anything</span>
                    </div>
                    <div className="fa-quick-grid">
                        {QUICK_PROMPTS.map((qp, idx) => {
                            const Icon = qp.icon;
                            return (
                                <button
                                    key={idx}
                                    className="fa-quick-btn"
                                    onClick={() => {
                                        setQuestion(qp.label);
                                        // auto-ask
                                        setTimeout(() => {
                                            setQuestion('');
                                            setChatHistory(prev => [...prev, { role: 'user', content: qp.label }]);
                                            setLoading(true);
                                            setError('');
                                            (async () => {
                                                try {
                                                    const globalContext = await getGlobalAiContext();
                                                    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
                                                    const response = await askFinancialAdvice(apiKey, qp.label, globalContext, '');
                                                    setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
                                                } catch (err) {
                                                    setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            })();
                                        }, 50);
                                    }}
                                >
                                    <Icon size={18} />
                                    <span>{qp.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─── Chat History ─── */}
            {chatHistory.length > 0 && (
                <div className="fa-chat-area">
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`fa-chat-bubble ${msg.role}`}>
                            <div className="fa-bubble-header">
                                {msg.role === 'user' ? 'You' : '🧠 Financial AI'}
                            </div>
                            {msg.role === 'assistant' ? (
                                <div className="fa-bubble-content ai-markdown-content">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="fa-bubble-content">{msg.content}</div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="fa-chat-bubble assistant">
                            <div className="fa-bubble-header">🧠 Financial AI</div>
                            <div className="fa-bubble-content fa-typing">
                                <span /><span /><span />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && <div className="da-error">{error}</div>}

            {/* ─── Input Bar ─── */}
            <div className="fa-input-bar">
                <input
                    type="text"
                    className="premium-input"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Ask about your finances, budgets, savings strategy..."
                    onKeyDown={e => e.key === 'Enter' && handleAsk()}
                    style={{ flex: 1 }}
                />
                <button
                    className="btn-glow"
                    onClick={handleAsk}
                    disabled={loading || !question.trim()}
                    style={{ padding: '12px 20px' }}
                >
                    {loading ? <Sparkles size={18} className="spin" /> : <Send size={18} />}
                </button>
            </div>
        </div>
    );
}
