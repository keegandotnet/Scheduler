import { CalendarDays } from 'lucide-react';
import { login } from '../actions/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <CalendarDays size={18} color="#fff" />
          </div>
          <span className="login-logo-name">Scheduler</span>
        </div>

        <h1 className="login-heading">Welcome back</h1>
        <p className="login-sub">Sign in to manage your shifts</p>

        {error && <div className="login-error">{error}</div>}

        <form action={login}>
          <div className="form-field">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="form-input"
              placeholder="you@example.com"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="form-input"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-login">Sign in</button>
        </form>
      </div>
    </div>
  );
}
