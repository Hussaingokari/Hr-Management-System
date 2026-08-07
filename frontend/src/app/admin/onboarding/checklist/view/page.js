import { Suspense } from 'react';
import ChecklistClient from './ChecklistClient';

export default function Page() {
    return (
        <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
            <ChecklistClient />
        </Suspense>
    );
}
