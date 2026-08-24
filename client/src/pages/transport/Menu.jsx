import { useState } from 'react';
import { useApp } from '../../context/useApp';
import { useTransport } from '../../context/useTransport';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import Toggle from '../../components/ui/Toggle';

export default function Menu() {
  const { formatMoney } = useApp();
  const { menu, addMenuItem, toggleMenuItem } = useTransport();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const onAdd = () => {
    if (!name.trim() || !(Number(price) > 0)) return;
    addMenuItem({ name, price: Number(price) });
    setName(''); setPrice(''); setAdding(false);
  };

  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Menu</h1>
        <Button size="sm" variant="secondary" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Cancel' : 'Add dish'}
        </Button>
      </div>

      {adding && (
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <TextField label="Dish name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Chapshuro" />
          <TextField label="Price (Rs)" type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} className="w-32" />
          <Button onClick={onAdd} disabled={!name.trim() || !(Number(price) > 0)}>Save dish</Button>
        </Card>
      )}

      <Card className="flex flex-col p-4 sm:p-5">
        {menu.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-0 first:pt-0">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className={`text-sm font-semibold ${m.on ? '' : 'text-fg-subtle line-through'}`}>{m.name}</span>
              <span className="font-mono text-xs text-fg-muted">{formatMoney(m.price)}</span>
              {!m.on && <span className="text-xs text-fg-subtle">Off the menu today</span>}
            </div>
            <Toggle id={`menu-${m.id}`} checked={m.on} onChange={() => toggleMenuItem(m.id)} label={m.on ? 'On' : 'Off'} />
          </div>
        ))}
      </Card>

      <p className="text-xs leading-relaxed text-fg-subtle">
        Turning a dish off never deletes it or its price history — it just tells travellers it isn't available today.
      </p>
    </div>
  );
}
