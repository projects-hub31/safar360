import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocial } from '../../context/social/useSocial';
import { POST_TYPES, POST_MAX_CHARS, HASHTAG_RE } from '../../context/social/social-context';
import { TOURS } from '../../data/traveler/tours';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ChoiceCard from '../../components/ui/ChoiceCard';
import SelectField from '../../components/ui/SelectField';
import Toggle from '../../components/ui/Toggle';

export default function Composer() {
  const navigate = useNavigate();
  const { createPost } = useSocial();

  const [type, setType] = useState('trip-report');
  const [text, setText] = useState('');
  const [tourId, setTourId] = useState('');
  const [disclosed, setDisclosed] = useState(false);
  const [partnership, setPartnership] = useState(false);

  const tags = useMemo(() => [...new Set((text.match(HASHTAG_RE) || []))], [text]);
  const overLimit = text.length > POST_MAX_CHARS;
  const needsDisclosure = partnership;
  const needsTour = type === 'announce-departure';
  const canPost = text.trim().length > 0 && !overLimit && (!needsTour || tourId) && (!needsDisclosure || disclosed);

  const onPost = () => {
    if (!canPost) return;
    createPost({ type, text: text.trim(), tags, tourId: needsTour ? tourId : null, disclosed: partnership && disclosed });
    navigate('/social/feed');
  };

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight">New post</h1>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {POST_TYPES.map((t) => (
          <ChoiceCard key={t.id} active={type === t.id} onClick={() => setType(t.id)} title={t.label} />
        ))}
      </div>

      {needsTour && (
        <SelectField
          label="Which tour is this?"
          value={tourId}
          onChange={(e) => setTourId(e.target.value)}
          options={[{ value: '', label: 'Choose a tour…' }, ...TOURS.map((t) => ({ value: t.id, label: t.title }))]}
          helper="Pulls live price and seats from the real listing — nothing here is baked in or held."
        />
      )}

      <Card className="flex flex-col gap-2 p-4 sm:p-5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          dir="auto"
          placeholder="Share what happened, what you saw, or what's coming up…"
          className="w-full resize-none rounded-lg border border-border-strong bg-raised p-3 text-[15px] text-fg placeholder:text-fg-subtle"
        />
        <div className="flex items-center justify-between text-xs">
          <span className={overLimit ? 'font-semibold text-danger-text' : 'text-fg-muted'}>{text.length} / {POST_MAX_CHARS}</span>
          {tags.length > 0 && <span className="text-fg-muted">{tags.join(' ')}</span>}
        </div>
      </Card>

      <Card className="flex flex-col gap-1 p-4 sm:p-5">
        <Toggle
          checked={partnership}
          onChange={(v) => { setPartnership(v); if (!v) setDisclosed(false); }}
          label="This is a paid partnership"
          description="Turning this on requires the disclosure checkbox below before you can post."
        />
        {partnership && (
          <label className="flex min-h-9 cursor-pointer items-center gap-2.5 border-t border-border pt-2.5 text-sm">
            <input type="checkbox" checked={disclosed} onChange={(e) => setDisclosed(e.target.checked)} className="h-[17px] w-[17px] accent-jade-600" />
            <span>I confirm this post discloses a paid partnership.</span>
          </label>
        )}
        {partnership && !disclosed && (
          <span className="text-xs text-danger-text">Undisclosed partnership content is removed and counts against your account — this checkbox is mandatory, not a style choice.</span>
        )}
      </Card>

      <Button onClick={onPost} disabled={!canPost} size="lg" fullWidth>Post</Button>
    </div>
  );
}
