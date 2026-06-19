const REQUIRED_SERVER_ENV = [
  "MONGODB_URI",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
] as const;

export type RequiredServerEnv = (typeof REQUIRED_SERVER_ENV)[number];
export type OptionalServerEnv =
  | "GROQ_API_KEY"
  | "NVIDIA_API_KEY"
  | "NODEMAILER_EMAIL"
  | "NODEMAILER_PASSWORD"
  | "CRON_SECRET"
  | "FINNHUB_API_KEY"
  | "TRADING_AGENTS_URL";

export function getEnv(name: RequiredServerEnv): string {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new Error(`${name} is required but is not configured.`);
  }

  return value;
}

export function getOptionalEnv(name: OptionalServerEnv): string | undefined {
  const value = process.env[name];
  return value?.trim() ? value : undefined;
}

export function getMissingRequiredEnv(): string[] {
  return REQUIRED_SERVER_ENV.filter((name) => !process.env[name]?.trim());
}

export function assertRequiredEnv() {
  const missing = getMissingRequiredEnv();

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}
