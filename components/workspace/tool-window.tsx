"use client";

import { Check, Loader2, Lock, Plug, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace, type ToolWindow as ToolWindowModel } from "@/components/workspace/workspace-context";
import { cn } from "@/lib/utils";
import type {
  EmailData,
  FileData,
  TableData,
  TaskData,
  TextData,
} from "@/lib/tools/types";

/**
 * One tool call, rendered as a window.
 *
 * There's a renderer per result *shape*, not per app — an inbox and a Drive
 * listing are both "a list of things", so adding a source doesn't add UI. When a
 * tool stops for approval this is where the Approve button lives, and approving
 * re-asks the agent with that one tool granted for that one turn.
 */
export function ToolWindow({ window }: { window: ToolWindowModel }) {
  const { ask } = useWorkspace();
  const result = window.result;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {!result ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin text-accent" />
          ) : result.notConnected ? (
            <Plug className="size-3.5 shrink-0 text-warn" />
          ) : result.needsConfirmation ? (
            <Lock className="size-3.5 shrink-0 text-warn" />
          ) : (
            <Check className="size-3.5 shrink-0 text-up" />
          )}
          <p className="truncate text-sm text-ink">{window.title}</p>
        </div>
        <Badge tone="neutral" className="shrink-0 font-mono normal-case tracking-normal">
          {window.toolName}
        </Badge>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {!result ? (
          <p className="p-3 text-xs text-ink-dim breathe">Working…</p>
        ) : result.needsConfirmation ? (
          <div className="space-y-3 p-3">
            <p className="text-sm text-ink">{result.needsConfirmation}</p>
            <p className="text-[11px] text-ink-dim">
              Nothing has happened yet. Approving grants{" "}
              <span className="font-mono">{window.toolName}</span> for one turn only.
            </p>
            <div className="flex gap-2">
              <Button
                variant="solid"
                size="sm"
                onClick={() =>
                  ask(`Approved — go ahead with ${window.toolName}.`, {
                    approve: window.toolName,
                  })
                }
              >
                <Check className="size-3.5" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => ask(`Don't do that — skip ${window.toolName}.`)}
              >
                <X className="size-3.5" />
                Decline
              </Button>
            </div>
          </div>
        ) : result.notConnected ? (
          <div className="space-y-2 p-3">
            <p className="text-sm text-warn">{result.notConnected}</p>
            <pre className="rounded-lg border border-line bg-bg-elevated p-2.5 text-[11px] leading-relaxed whitespace-pre-wrap text-ink-muted">
              {(result.data as TextData).text}
            </pre>
          </div>
        ) : (
          <PanelBody window={window} />
        )}
      </div>
    </div>
  );
}

function PanelBody({ window }: { window: ToolWindowModel }) {
  const result = window.result!;

  switch (result.panel) {
    case "table":
      return <TableView data={result.data as TableData} />;
    case "email":
      return <EmailView data={result.data as EmailData} />;
    case "tasks":
      return <TaskView data={result.data as TaskData} />;
    case "files":
      return <FileView data={result.data as FileData} />;
    default:
      return (
        <pre className="p-3 text-xs leading-relaxed whitespace-pre-wrap text-ink-muted">
          {(result.data as TextData).text}
        </pre>
      );
  }
}

function TableView({ data }: { data: TableData }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-line">
            {data.columns.map((column) => (
              <th
                key={column}
                className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap text-ink-dim"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                "border-b border-line/50",
                // A trailing ALL row is a total, so it reads as one.
                row[0] === "ALL" && "bg-bg-elevated/60 font-medium",
              )}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    "px-2.5 py-1.5 whitespace-nowrap tabular",
                    cellIndex === 0 ? "text-ink" : "text-ink-muted",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.footnote ? (
        <p className="px-2.5 py-2 text-[11px] text-warn">{data.footnote}</p>
      ) : null}
    </div>
  );
}

function EmailView({ data }: { data: EmailData }) {
  return (
    <ul className="divide-y divide-line/50">
      {data.messages.map((message) => (
        <li key={message.id} className="px-3 py-2">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={cn(
                "truncate text-xs",
                message.unread ? "font-medium text-ink" : "text-ink-muted",
              )}
            >
              {message.from}
            </p>
            <span className="shrink-0 text-[10px] tabular text-ink-dim">
              {message.date}
            </span>
          </div>
          <p className="truncate text-sm text-ink">{message.subject}</p>
          <p className="truncate text-[11px] text-ink-dim">{message.snippet}</p>
        </li>
      ))}
    </ul>
  );
}

function TaskView({ data }: { data: TaskData }) {
  return (
    <ul className="divide-y divide-line/50">
      {data.tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-2 px-3 py-2">
          <span className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{task.name}</p>
            <p className="truncate text-[11px] text-ink-dim">
              {[task.status, task.due, task.assignee].filter(Boolean).join(" · ")}
            </p>
          </span>
        </li>
      ))}
    </ul>
  );
}

function FileView({ data }: { data: FileData }) {
  return (
    <ul className="divide-y divide-line/50">
      {data.files.map((file) => (
        <li key={file.id} className="px-3 py-2">
          <p className="truncate text-sm text-ink">{file.name}</p>
          <p className="truncate text-[11px] text-ink-dim">
            {file.kind} · {file.modified}
          </p>
        </li>
      ))}
    </ul>
  );
}
