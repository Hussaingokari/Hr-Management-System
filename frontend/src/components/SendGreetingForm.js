'use client';

import { useState, useEffect } from 'react';
import { useGreeting } from '@/lib/useGreeting';
import { Mail, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import DOMPurify from 'dompurify';

export default function SendGreetingForm() {
    const { loading, error, success, sendGreeting } = useGreeting();

    const [candidateName, setCandidateName] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [templateId, setTemplateId] = useState(1);
    const [templates, setTemplates] = useState([]);
    const [greetingPreview, setGreetingPreview] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
            } catch (e) {
                console.error('Failed to parse user data');
            }
        }
    }, []);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const { default: api } = await import('@/lib/axios');
                const response = await api.get('/api/greeting/templates', {
                    params: { _t: Date.now() },
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Expires': '0',
                    }
                });

                const data = response.data;

                if (Array.isArray(data)) {
                    setTemplates(data);

                    if (data.length > 0) {
                        const greetingTemplate =
                            data.find(t => t.templateName === 'Admission Greeting') || data[0];

                        if (greetingTemplate) {
                            setTemplateId(greetingTemplate.id);
                        }
                    }
                } else {
                    console.error('Invalid response format for templates:', data);
                    setTemplates([]);
                }
            } catch (err) {
                console.error('Failed to fetch templates:', err);
            }
        };

        fetchTemplates();
    }, []);

    useEffect(() => {
        const template = templates.find(t => t.id === templateId);

        if (template && candidateName) {
            const preview = template.templateBody.replace(
                '{CANDIDATE_NAME}',
                candidateName
            );
            setGreetingPreview(preview);
        } else if (template) {
            setGreetingPreview(template.templateBody);
        }
    }, [candidateName, templateId, templates]);

    const handleSendGreeting = async (e) => {
        e.preventDefault();
        setShowSuccess(false);

        if (!candidateName.trim()) {
            alert('Please enter candidate name');
            return;
        }

        if (!recipientEmail.trim()) {
            alert('Please enter email address');
            return;
        }

        const adminId = currentUser?.id || 1;

        const adminName = currentUser
            ? `${currentUser.firstName} ${currentUser.lastName}`
            : 'System Admin';

        const response = await sendGreeting({
            candidateName,
            recipientEmail,
            templateId,
            adminId,
            adminName,
        });

        if (response?.success) {
            setShowSuccess(true);
            setCandidateName('');
            setRecipientEmail('');
            setTimeout(() => setShowSuccess(false), 5000);
        }
    };

    const handleCancel = () => {
        setCandidateName('');
        setRecipientEmail('');
        setShowSuccess(false);
    };

    return (
        <div
            style={{
                width: '100%',
                maxWidth: '600px',
                margin: '0 auto',
                padding: '32px 24px',
                background: 'var(--card-bg)',
                borderRadius: '12px',
                border: '1px solid var(--card-border)',
                boxShadow: 'var(--card-shadow)',
            }}
        >
            <div style={{ marginBottom: '32px' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '12px',
                    }}
                >
                    <Mail size={28} color="#3b82f6" strokeWidth={2} />

                    <h1
                        style={{
                            fontSize: '28px',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            margin: 0,
                        }}
                    >
                        Send Greeting to Candidate
                    </h1>
                </div>

                <p
                    style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        margin: '8px 0 0 0',
                    }}
                >
                    Send admission greetings directly to candidate email
                </p>
            </div>

            <form
                onSubmit={handleSendGreeting}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                }}
            >
                <div>
                    <label
                        htmlFor="candidateName"
                        style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '8px',
                        }}
                    >
                        Candidate Name
                    </label>

                    <input
                        type="text"
                        id="candidateName"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="Enter candidate name (e.g., Enter Name)"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1.5px solid var(--card-border)',
                            borderRadius: '8px',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.6 : 1,
                        }}
                        onFocusCapture={(e) => {
                            e.target.style.borderColor = '#3b82f6';
                        }}
                        onBlurCapture={(e) => {
                            e.target.style.borderColor = 'var(--card-border)';
                        }}
                    />
                </div>

                <div>
                    <label
                        htmlFor="recipientEmail"
                        style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '8px',
                        }}
                    >
                        Email Address
                    </label>

                    <input
                        type="email"
                        id="recipientEmail"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="Enter email (e.g., name@gmail.com)"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1.5px solid var(--card-border)',
                            borderRadius: '8px',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.6 : 1,
                        }}
                        onFocusCapture={(e) => {
                            e.target.style.borderColor = '#3b82f6';
                        }}
                        onBlurCapture={(e) => {
                            e.target.style.borderColor = 'var(--card-border)';
                        }}
                    />
                </div>

                <div>
                    <label
                        style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '8px',
                        }}
                    >
                        Greeting Preview
                    </label>

                    <div
                        style={{
                            width: '100%',
                            padding: '12px 12px',
                            border: '1.5px solid var(--card-border)',
                            borderRadius: '8px',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            fontSize: '12px',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            boxSizing: 'border-box',
                        }}
                        dangerouslySetInnerHTML={{
                            __html: greetingPreview
                                ? DOMPurify.sanitize(greetingPreview)
                                : 'Enter candidate name to see preview...',
                        }}
                    />
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                    }}
                >
                    <div
                        style={{
                            border: '1.5px solid var(--card-border)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            background: 'var(--bg-primary)',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                margin: '0 0 6px 0',
                                fontWeight: '500',
                            }}
                        >
                            Name:
                        </p>

                        <p
                            style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                margin: 0,
                            }}
                        >
                            {candidateName || '[CANDIDATE_NAME]'}
                        </p>
                    </div>

                    <div
                        style={{
                            border: '1.5px solid var(--card-border)',
                            borderRadius: '8px',
                            padding: '12px 14px',
                            background: 'var(--bg-primary)',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '11px',
                                color: 'var(--text-secondary)',
                                margin: '0 0 6px 0',
                                fontWeight: '500',
                            }}
                        >
                            Email:
                        </p>

                        <p
                            style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                margin: 0,
                                wordBreak: 'break-all',
                            }}
                        >
                            {recipientEmail || '[EMAIL_ADDRESS]'}
                        </p>
                    </div>
                </div>

                {error && (
                    <div
                        style={{
                            padding: '12px 14px',
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '12px',
                                color: '#991b1b',
                                margin: 0,
                            }}
                        >
                            <AlertTriangle
                                size={14}
                                style={{
                                    display: 'inline',
                                    marginRight: '4px',
                                }}
                            />{' '}
                            {error}
                        </p>
                    </div>
                )}

                {showSuccess && success && (
                    <div
                        style={{
                            padding: '12px 14px',
                            background: '#dcfce7',
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '12px',
                                color: '#166534',
                                margin: 0,
                            }}
                        >
                            <CheckCircle
                                size={14}
                                style={{
                                    display: 'inline',
                                    marginRight: '4px',
                                }}
                            />{' '}
                            {success}
                        </p>
                    </div>
                )}

                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end',
                        paddingTop: '8px',
                    }}
                >
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        style={{
                            padding: '8px 16px',
                            border: '1.5px solid var(--card-border)',
                            borderRadius: '8px',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        CANCEL
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '8px 20px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: loading ? 0.8 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.background = '#2563eb';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.background = '#3b82f6';
                            }
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader
                                    size={16}
                                    strokeWidth={2}
                                    style={{
                                        animation: 'spin 1s linear infinite',
                                    }}
                                />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail size={16} strokeWidth={2} />
                                SEND GREETING
                            </>
                        )}
                    </button>
                </div>
            </form>

            <style>{`
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                input::placeholder {
                    color: var(--text-secondary);
                }
            `}</style>
        </div>
    );
}