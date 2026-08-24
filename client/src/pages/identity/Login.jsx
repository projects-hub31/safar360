import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const onSubmit = (e) => {
    e.preventDefault();
    const result = login({ identifier, password });
    if (!result.ok) {
      setError('Enter your password to continue.');
      return;
    }
    navigate('/discover/home');
  };

  return (
    <div className="mx-auto flex max-w-[440px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Sign in</h1>
        <p className="text-sm leading-relaxed text-fg-muted">Use the phone or email you registered with.</p>
      </div>

      <Card className="flex flex-col gap-4 p-4 sm:p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          <TextField
            label="Phone or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="300 1234567 or you@example.com"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />
          <Button type="submit" disabled={!identifier.trim()} size="lg">
            Sign in
          </Button>
        </form>
        <p className="text-center text-xs text-fg-muted">
          Forgot your password?{' '}
          <Link to="/identity/register" className="font-semibold">
            Register your number
          </Link>{' '}
          to reset it — we'll recognise it and offer a reset instead.
        </p>
      </Card>

      <Card className="flex flex-col gap-2 p-4 text-xs leading-relaxed text-fg-muted sm:p-5">
        <strong className="text-[13px] text-fg">How we keep this account safe</strong>
        <span>A reused or replayed session token signs you out everywhere, not just here.</span>
        <span>Resetting your password ends every other signed-in session immediately.</span>
        <span>Recovery always sends a one-time code — never a password, and support can't read or set one.</span>
        <span>Repeated failed sign-ins on a number are rate-limited; we'll tell you if that happens.</span>
      </Card>

      <p className="text-center text-sm text-fg-muted">
        New here?{' '}
        <Link to="/identity/role" className="font-semibold">
          Create an account
        </Link>
      </p>
    </div>
  );
}
