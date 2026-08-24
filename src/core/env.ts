// Environment access that works on both runtimes.
//
// The same core code runs under Node for the local CLI and under Deno inside a
// Supabase Edge Function, and the two disagree about how to read environment
// variables. Everything else in src/ stays free of runtime specific APIs.

interface DenoLike {
  env?: { get(name: string): string | undefined };
}

export function getEnv(name: string): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  const fromNode = proc?.env?.[name];
  if (fromNode) return fromNode;
  const deno = (globalThis as { Deno?: DenoLike }).Deno;
  try {
    return deno?.env?.get(name);
  } catch {
    // Deno throws without the env permission. Treat that as unset.
    return undefined;
  }
}

export function requireEnv(name: string, hint = ''): string {
  const v = getEnv(name);
  if (!v) throw new Error(`${name} is not set.${hint ? ` ${hint}` : ''}`);
  return v;
}
