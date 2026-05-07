import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <section className="grid gap-6 md:grid-cols-[1fr_420px] md:items-center">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-coral">Lecture notes, faster</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal">Turn PDFs into useful study notes.</h1>
        <p className="mt-4 max-w-xl text-muted">
          Sign in with Supabase auth, organize lectures by course, and generate Markdown notes from uploaded slides.
        </p>
      </div>
      <LoginForm />
    </section>
  );
}
