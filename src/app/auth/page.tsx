export default function AuthPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form className="w-full max-w-sm rounded-lg border border-line bg-white p-5 shadow-panel">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <label className="mt-5 grid gap-1 text-sm font-semibold">
          Email
          <input className="h-10 rounded-lg border border-line px-3 font-normal outline-none focus:border-accent" defaultValue="demo@example.com" type="email" />
        </label>
        <label className="mt-3 grid gap-1 text-sm font-semibold">
          Password
          <input className="h-10 rounded-lg border border-line px-3 font-normal outline-none focus:border-accent" defaultValue="password123" type="password" />
        </label>
        <button className="mt-5 w-full rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white" type="button">
          Continue
        </button>
      </form>
    </main>
  );
}
