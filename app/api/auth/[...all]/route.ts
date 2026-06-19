import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/better-auth/auth";

async function handler(request: Request) {
  const auth = await getAuth();
  return toNextJsHandler(auth).GET(request);
}

export const GET = handler;
export const POST = handler;
