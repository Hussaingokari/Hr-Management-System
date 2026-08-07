'use client';

import SendGreetingForm from '@/components/SendGreetingForm';

export default function GreetingsPage() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            padding: '32px 24px',
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
            }}>
                <div style={{
                    marginBottom: '32px',
                }}>
                    <nav style={{
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                    }}>
                        <a
                            href="/admin/dashboard"
                            style={{
                                color: '#3b82f6',
                                textDecoration: 'none',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                            Dashboard
                        </a>
                        <span style={{ margin: '0 8px' }}>/</span>
                        <a
                            href="/admin/onboarding"
                            style={{
                                color: '#3b82f6',
                                textDecoration: 'none',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                            Onboarding
                        </a>
                        <span style={{ margin: '0 8px' }}>/</span>
                        <span style={{
                            color: 'var(--text-primary)',
                            fontWeight: '600',
                        }}>
                            Send Greeting
                        </span>
                    </nav>
                </div>

                <SendGreetingForm />
            </div>
        </div>
    );
}