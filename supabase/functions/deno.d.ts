// Minimal ambient declarations for the Deno globals the edge function uses.
// The Supabase Edge runtime provides these. Declaring just what is used keeps the
// whole repo checkable under one tsconfig without pulling in the Deno type suite.

declare namespace Deno {
  function serve(handler: (req: Request) => Response | Promise<Response>): unknown;
  const env: { get(name: string): string | undefined };
}
