import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import SelectField from '../../components/ui/SelectField';
import ChoiceCard from '../../components/ui/ChoiceCard';
import DocumentUpload from '../../components/identity/DocumentUpload';
import { CNIC_ERROR, isValidCnic } from '../../utils/validators';
import { DOC_TYPE, mapDocsToSlots, mapOneDocToSlot } from '../../utils/kycDocs';

const STEPS = ['Account', 'Documents', 'Plan'];
const DRAFT_KEY = 's360-kyc-draft';

const REGIONS = [
  { value: 'gb', label: 'Gilgit-Baltistan' },
  { value: 'kpk', label: 'Khyber Pakhtunkhwa' },
  { value: 'ajk', label: 'Azad Kashmir' },
  { value: 'balochistan', label: 'Balochistan' },
];

const PLANS = [
  { id: 'starter', name: 'Starter', price: 2500, listings: '3 listings', commission: '15% commission' },
  { id: 'growth', name: 'Growth', price: 6500, listings: '15 listings', commission: '12% commission' },
  { id: 'pro', name: 'Pro', price: 14000, listings: 'Unlimited listings', commission: '9% commission' },
];

const EMPTY_DOC = { status: 'empty', filename: null, reason: null };
const EMPTY_DOCS = { cnicFront: EMPTY_DOC, cnicBack: EMPTY_DOC, registration: EMPTY_DOC };

function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Real document review only exists for `operator` (utils/kycDocs.js's own
// note — the server gates the whole /vendor/kyc/documents surface behind
// requireRole('operator')). transport/property/seller keep the pre-existing
// local-mock flow below rather than silently 403ing.
export default function Kyc() {
  const navigate = useNavigate();
  const { user, submitKyc, fetchKycDocuments, submitKycDocument, refreshUser } = useAuth();
  const isOperator = user?.role === 'operator';

  const draft = readDraft();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState(draft?.businessName || '');
  const [region, setRegion] = useState(draft?.region || REGIONS[0].value);
  const [cnic, setCnic] = useState(draft?.cnic || '');
  const [cnicTouched, setCnicTouched] = useState(false);
  const [docs, setDocs] = useState(draft?.docs || EMPTY_DOCS);
  const [plan, setPlan] = useState(draft?.plan || 'starter');

  // A returning operator resubmitting one rejected document must see their
  // other two already-submitted docs, not a blank wizard (§3: "resubmission
  // is scoped per rejected document, not a full re-upload") — real state
  // always wins over whatever's in the local draft.
  useEffect(() => {
    if (!isOperator) return undefined;
    let cancelled = false;
    fetchKycDocuments().then((res) => {
      if (!cancelled && res.ok) setDocs(mapDocsToSlots(res.documents));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave per step (§6 kyc) — a dropped connection must not lose typing.
  // Real documents autosave themselves the moment each one is submitted (the
  // server, not localStorage), so only account-detail fields need a local
  // draft for `operator`; the pre-existing mock flow still drafts everything
  // for the roles with no real backend to submit to.
  const snapshot = JSON.stringify(isOperator ? { businessName, region, cnic } : { businessName, region, cnic, docs, plan });
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot);

  useEffect(() => {
    if (snapshot === savedSnapshot) return undefined;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, snapshot);
      } catch {
        /* storage unavailable */
      }
      setSavedSnapshot(snapshot);
    }, 300);
    return () => clearTimeout(t);
  }, [snapshot, savedSnapshot]);

  const saveNote = snapshot === savedSnapshot ? 'All changes saved' : 'Saving…';

  const cnicOk = isValidCnic(cnic);
  const cnicError = cnicTouched && !cnicOk ? CNIC_ERROR : null;

  const stepValid = [
    businessName.trim().length > 0,
    cnicOk && docs.cnicFront.status === 'done' && docs.cnicBack.status === 'done' && docs.registration.status === 'done',
    true,
  ];

  // Real submission happens per document, the moment each is chosen
  // (DocumentUpload's onUpload below) — this only picks up the aggregate
  // kycStatus the server already recomputed, and clears the local draft.
  const onSubmit = async () => {
    if (isOperator) {
      await refreshUser();
    } else {
      submitKyc({ businessName, region, cnic, docs, plan });
    }
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* storage unavailable */
    }
    navigate('/identity/kyc-pending');
  };

  const uploadDoc = async (clientKey, file) => {
    const res = await submitKycDocument(DOC_TYPE[clientKey], file.name);
    if (!res.ok) return { ok: false, message: res.message };
    return { ok: true, slot: mapOneDocToSlot(res.document) };
  };

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Verify your business</h1>
        <p className="text-sm leading-relaxed text-fg-muted">
          Usually reviewed within 24 hours. You can save and come back at any step.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col gap-1.5">
            <div className={`h-1.5 rounded-full ${i <= step ? 'bg-primary' : 'bg-border'}`} />
            <span className={`text-xs font-semibold ${i === step ? 'text-fg' : 'text-fg-subtle'}`}>{s}</span>
          </div>
        ))}
      </div>
      <span className="text-xs text-fg-subtle sm:hidden">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </span>

      <Card className="flex flex-col gap-4 p-4 sm:p-5">
        {step === 0 && (
          <>
            <TextField
              label="Business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="As it appears on your registration"
            />
            <SelectField
              label="Operating region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              options={REGIONS}
            />
          </>
        )}

        {step === 1 && (
          <>
            <TextField
              label="Owner CNIC"
              dir="ltr"
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              onBlur={() => setCnicTouched(true)}
              error={cnicError}
              placeholder="00000-0000000-0"
            />
            <DocumentUpload
              label="CNIC — front"
              constraint="JPG or PDF, up to 5 MB"
              value={docs.cnicFront}
              onChange={(v) => setDocs((d) => ({ ...d, cnicFront: v }))}
              onUpload={isOperator ? (file) => uploadDoc('cnicFront', file) : undefined}
            />
            <DocumentUpload
              label="CNIC — back"
              constraint="JPG or PDF, up to 5 MB"
              value={docs.cnicBack}
              onChange={(v) => setDocs((d) => ({ ...d, cnicBack: v }))}
              onUpload={isOperator ? (file) => uploadDoc('cnicBack', file) : undefined}
            />
            <DocumentUpload
              label="Business registration certificate"
              constraint="JPG or PDF, up to 5 MB"
              value={docs.registration}
              onChange={(v) => setDocs((d) => ({ ...d, registration: v }))}
              onUpload={isOperator ? (file) => uploadDoc('registration', file) : undefined}
            />
          </>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-2.5">
            {PLANS.map((p) => (
              <ChoiceCard
                key={p.id}
                active={plan === p.id}
                onClick={() => setPlan(p.id)}
                title={p.name}
                subtitle={`${p.listings} · ${p.commission}`}
                meta={`Rs ${p.price.toLocaleString('en-US')}/mo`}
              />
            ))}
            <p className="text-xs leading-relaxed text-fg-subtle">
              You can change plans later. Billing only starts once your documents are approved.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3.5">
          <span className="font-mono text-[11px] text-fg-subtle">{saveNote}</span>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!stepValid[step]}>
                Next
              </Button>
            ) : (
              <Button onClick={onSubmit}>Submit for review</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
