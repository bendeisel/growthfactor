// cards-stack.tsx imports `cn` from "@/lib/utils", the shadcn helper that is
// clsx plus tailwind-merge. This site has no Tailwind, so there are no
// conflicting utility classes to merge and joining the truthy values is all
// `cn` has to do here. Kept so the component compiles exactly as supplied.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ")
}
