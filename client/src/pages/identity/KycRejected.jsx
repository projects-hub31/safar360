import { useEffect, useState } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import { REJECTION_LABELS } from '../../utils/kycDocs';

export default function KycRejected() {
  const { user, fetchKycDocuments } = useAuth();
  const isOperator = user?.role === 'operator';
  const [realReason, setRealReason] = useState(null);

  // The real rejection reason lives per-document (KycDocument.rejectionReason),
  // not on the User record at all — there's no aggregate `kycReason` field to
  // read for a real account, unlike the mock path's `user.kycReason`.
  useEffect(() => {
    if (!isOperator) return undefined;
    let cancelled = false;
    fetchKycDocuments().then((res) => {
      if (cancelled || !res.ok) return;
      const rejectedDoc = res.documents.find((d) => d.status === 'rejected');
      if (rejectedDoc) setRealReason(REJECTION_LABELS[rejectedDoc.rejectionReason] || 'One document needs another look.');
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reason = isOperator
    ? (realReason || 'Checking which document was rejected…')
    : (user?.kycReason || 'The registration certificate photo is too blurry to read the expiry date.');

  return (
    <Card className="mx-auto flex max-w-[480px] flex-col items-start gap-4 p-5 sm:p-6">
      <StatusPill tone="danger" icon="✕">Rejected</StatusPill>
      <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">One document needs another look</span>
      <div className="w-full rounded-xl border border-danger bg-danger-soft p-3.5 text-sm leading-relaxed text-danger-text">
        {reason}
      </div>
      <p className="text-sm leading-relaxed text-fg-muted">
        You only need to resubmit the document above — not start over. Everything else you already sent stays on
        file.
      </p>
      <Button to="/identity/kyc" fullWidth>
        Resubmit that document
      </Button>
    </Card>
  );
}
