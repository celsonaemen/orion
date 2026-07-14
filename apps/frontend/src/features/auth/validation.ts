export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export type LoginValidationResult =
  | {
      isValid: true;
      values: {
        email: string;
        password: string;
      };
      errors: LoginFieldErrors;
    }
  | {
      isValid: false;
      values: {
        email: string;
        password: string;
      };
      errors: LoginFieldErrors;
    };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginFields(input: {
  email: unknown;
  password: unknown;
}): LoginValidationResult {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const errors: LoginFieldErrors = {};

  if (!email) {
    errors.email = "Informe o e-mail.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Informe um e-mail valido.";
  }

  if (!password) {
    errors.password = "Informe a senha.";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    values: {
      email,
      password,
    },
  } as LoginValidationResult;
}
