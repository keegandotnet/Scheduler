import { login } from '../actions/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="login-page">
      <h1>Scheduler</h1>
      <form action={login} className="login-form">
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit">Sign In</button>
      </form>
    </main>
  );
}
