'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getMyOnboarding, getMyDocuments, uploadFile, uploadOnboardingDocument } from '@/lib/employeeApi';
import toast from 'react-hot-toast';

const DOC_KEY_LABELS = {
    OFFER_LETTER: 'Offer Letter',
    AADHAR_CARD: 'Aadhar Card',
    PAN_CARD: 'PAN Card',
    SSC_CERTIFICATE: 'SSC Certificate',
    INTER_DIPLOMA_CERTIFICATE: 'Inter / Diploma Certificate',
    DEGREE_CERTIFICATE: 'Degree Certificate',
    BANK_PASSBOOK: 'Bank Passbook',
};

function StatusPill({ status }) {
    const map = {
        UNDER_REVIEW: { bg: '#fef9c3', color: '#ca8a04', label: 'Under Review' },
        APPROVED: { bg: '#dcfce7', color: '#16a34a', label: 'Approved' },
        REJECTED: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
    };
    const s = map[status] || { bg: '#f1f5f9', color: 'var(--text-secondary)', label: 'Not Submitted' };
    return (
        <span style={{
            background: s.bg, color: s.color, padding: '6px 16px', borderRadius: '20px',
            fontSize: '13px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px',
            whiteSpace: 'nowrap',
        }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.color }} />
            {s.label}
        </span>
    );
}

function DocumentRow({ documentKey, doc, onUpload, isUploading }) {
    const inputRef = useRef(null);
    const status = doc?.status;
    const canUpload = !status || status === 'REJECTED';
    const isRejected = status === 'REJECTED';

    return (
        <div style={{
            background: 'var(--card-bg)', borderRadius: '14px',
            border: isRejected ? '1.5px solid #fecaca' : '1px solid #e2e8f0',
            padding: '18px 20px', marginBottom: '12px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    width: '46px', height: '46px', borderRadius: '12px', background: 'var(--card-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0,
                }}>
                    📄
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {DOC_KEY_LABELS[documentKey]}
                    </div>
                    {doc?.fileName && (
                        <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px' }}>
                            {doc.fileUrl ? (
                                <a href={doc.fileUrl?.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}${doc.fileUrl}` : doc.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>{doc.fileName}</a>
                            ) : doc.fileName}
                        </div>
                    )}
                </div>
                <StatusPill status={status} />
                <input
                    ref={inputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) onUpload(documentKey, file);
                        e.target.value = '';
                    }}
                />
                <button
                    onClick={() => inputRef.current?.click()}
                    disabled={!canUpload || isUploading}
                    style={{
                        padding: '10px 20px', borderRadius: '10px', border: 'none',
                        fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap',
                        background: !canUpload ? '#e2e8f0' : isRejected ? '#fee2e2' : '#eff6ff',
                        color: !canUpload ? '#94a3b8' : isRejected ? '#dc2626' : '#3b82f6',
                        cursor: (!canUpload || isUploading) ? 'not-allowed' : 'pointer',
                    }}>
                    {isUploading ? 'Uploading...' : isRejected ? 'Re-upload' : 'Upload'}
                </button>
            </div>

            {isRejected && doc?.rejectionRemarks && (
                <div style={{
                    marginTop: '12px', marginLeft: '62px',
                    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
                    padding: '10px 14px',
                }}>
                    <div style={{ fontSize: '13px', color: '#dc2626' }}>
                        💬 {doc.rejectionRemarks}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EmployeeOnboardingDocumentsPage() {
    const [onboarding, setOnboarding] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingKey, setUploadingKey] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMyOnboarding();
            const onb = res.data?.data;
            setOnboarding(onb);
            if (onb?.id) {
                const docRes = await getMyDocuments(onb.id);
                setDocuments(docRes.data?.data || []);
            }
        } catch (err) {
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpload = async (documentKey, file) => {
        if (!onboarding?.id) return;
        setUploadingKey(documentKey);
        try {
            const uploadRes = await uploadFile(file);
            const { url, fileName } = uploadRes.data?.data || {};
            if (!url) throw new Error('Upload did not return a file URL');

            const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
            const fileUrl = `${BACKEND_BASE_URL}${url}`;

            await uploadOnboardingDocument(onboarding.id, documentKey, { fileUrl, fileName });
            toast.success('Document submitted for review');
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploadingKey(null);
        }
    };

    const docsByKey = documents.reduce((acc, d) => { acc[d.documentKey] = d; return acc; }, {});

    if (loading) {
        return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
    }

    if (!onboarding) {
        return (
            <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)', padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>No onboarding checklist yet</div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    My Documents
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Upload your onboarding documents for HR review.
                </p>
            </div>

            {Object.keys(DOC_KEY_LABELS).map(key => (
                <DocumentRow
                    key={key}
                    documentKey={key}
                    doc={docsByKey[key]}
                    onUpload={handleUpload}
                    isUploading={uploadingKey === key}
                />
            ))}
        </div>
    );
}