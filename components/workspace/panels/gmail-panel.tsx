import { PanelPlaceholder } from "@/components/workspace/panels/panel-placeholder";

/** Accounts named in spec §4. Ben adds the rest at OAuth time. */
const ACCOUNTS = [
  "ben@nashvillemma.com",
  "ben@fightersboxing.com",
  "support@growth-factor.ai",
];

/** Tone presets Ben trains by example (spec §4). */
const PRESETS = ["Reply yes", "Reply no", "Schedule meeting"];

export function GmailPanel() {
  return (
    <PanelPlaceholder
      phase="Phase 4"
      source="Gmail API"
      features={[
        "One unread feed across every account, visually separated by account",
        "Priority order learned from how Ben triages, not by date",
        "Type or tap: archive, reply, draft, forward, filter-rule, mark spam",
        "Megatron drafts in Ben's voice and waits for approval before sending",
        "Edit a preset reply inline and save it as the new default",
      ]}
      needs={[
        "GOOGLE_OAUTH_CLIENT_ID",
        "GOOGLE_OAUTH_CLIENT_SECRET",
        "scope: gmail.modify + gmail.compose",
      ]}
    >
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
            Accounts
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ACCOUNTS.map((account) => (
              <span
                key={account}
                className="rounded-full border border-line-bright px-2 py-0.5 font-mono text-[11px] text-ink-muted"
              >
                {account}
              </span>
            ))}
            <span className="rounded-full border border-dashed border-line-bright px-2 py-0.5 text-[11px] text-ink-dim">
              + more at OAuth
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
            Tone presets
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <span
                key={preset}
                className="rounded-full border border-violet/40 bg-violet/10 px-2 py-0.5 text-[11px] text-violet"
              >
                {preset}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-ink-dim">
          Target: inbox clear in five minutes, not sixty.
        </p>
      </div>
    </PanelPlaceholder>
  );
}
