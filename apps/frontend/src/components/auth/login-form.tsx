"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useId, useState } from "react";

import { login } from "@/features/auth/client";
import { LoginFieldErrors, validateLoginFields } from "@/features/auth/validation";

const INVALID_CREDENTIALS_MESSAGE = "E-mail ou senha invalidos.";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [statusMessage, setStatusMessage] = useState(
    searchParams.get("expired") ? "Sessao expirada. Entre novamente." : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateLoginFields({ email, password });
    setErrors(validation.errors);
    setStatusMessage("");

    if (!validation.isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(validation.values);

      if (!result.ok) {
        setStatusMessage(result.status === 401 ? INVALID_CREDENTIALS_MESSAGE : result.message);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setStatusMessage("Nao foi possivel acessar o Orion agora.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-slate-100" htmlFor={emailId}>
          E-mail
        </label>
        <input
          autoComplete="email"
          className="mt-2 block w-full border border-slate-600 bg-slate-950 px-4 py-3 text-base text-white outline-none transition focus:border-teal-300 focus:ring-2 focus:ring-teal-300/30"
          id={emailId}
          inputMode="email"
          name="email"
          onChange={(event) => {
            setEmail(event.target.value);
          }}
          placeholder="admin@orion.local"
          type="email"
          value={email}
        />
        {errors.email ? <p className="mt-2 text-sm text-rose-200">{errors.email}</p> : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-100" htmlFor={passwordId}>
          Senha
        </label>
        <div className="mt-2 flex border border-slate-600 bg-slate-950 focus-within:border-teal-300 focus-within:ring-2 focus-within:ring-teal-300/30">
          <input
            autoComplete="current-password"
            className="block min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-white outline-none"
            id={passwordId}
            name="password"
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="border-l border-slate-700 px-4 text-sm font-medium text-teal-200 outline-none transition hover:bg-slate-800 focus:bg-slate-800"
            onClick={() => {
              setShowPassword((current) => !current);
            }}
            type="button"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        {errors.password ? (
          <p className="mt-2 text-sm text-rose-200">{errors.password}</p>
        ) : null}
      </div>

      {statusMessage ? (
        <p className="border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          {statusMessage}
        </p>
      ) : null}

      <button
        className="flex w-full items-center justify-center bg-teal-400 px-4 py-3 text-base font-semibold text-slate-950 outline-none transition hover:bg-teal-300 focus:ring-2 focus:ring-teal-200 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
