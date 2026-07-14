import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-300">
              Orion Core
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-5xl">
              Acesso seguro ao Orion
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Entre com as credenciais internas para acessar o dashboard inicial da
              fundacao autenticada.
            </p>
          </div>

          <div className="border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/30">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Login</h2>
              <p className="mt-2 text-sm text-slate-400">Use uma conta ficticia do seed local.</p>
            </div>
            <Suspense fallback={<p className="text-sm text-slate-300">Carregando...</p>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
