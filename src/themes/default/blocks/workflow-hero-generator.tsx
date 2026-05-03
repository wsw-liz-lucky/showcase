'use client';

import { useMemo, useState } from 'react';
import {
  BracesIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  Loader2Icon,
  PlayIcon,
  SendHorizontalIcon,
  SparklesIcon,
  WorkflowIcon,
} from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';

type WorkflowHeroGeneratorConfig = {
  eyebrow?: string;
  input_label?: string;
  output_label?: string;
  placeholder?: string;
  submit_label?: string;
  loading_label?: string;
  copy_label?: string;
  copied_label?: string;
  download_label?: string;
  empty_output?: string;
  error_prefix?: string;
  sample_prompts?: string[];
  stats?: {
    label: string;
    value: string;
  }[];
};

const DEFAULT_LOADING_MESSAGE = 'Generating workflow JSON...';

const defaultWorkflowJson = `{
  "name": "Lead intake workflow",
  "nodes": [
    {
      "id": "manual-trigger",
      "name": "Start",
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [0, 0],
      "parameters": {}
    }
  ],
  "connections": {},
  "settings": {},
  "active": false
}`;

function stripCodeFence(text: string) {
  const fencedCode = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fencedCode?.[1]?.trim() ?? text;
}

export function WorkflowHeroGenerator({
  config,
}: {
  config?: WorkflowHeroGeneratorConfig;
}) {
  const samples = config?.sample_prompts ?? [];
  const [prompt, setPrompt] = useState(samples[0] ?? '');
  const [workflowJson, setWorkflowJson] = useState(defaultWorkflowJson);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const formattedOutput = useMemo(
    () => stripCodeFence(workflowJson),
    [workflowJson]
  );

  async function generateWorkflow() {
    const requirement = prompt.trim();
    if (!requirement || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsCopied(false);
    setWorkflowJson(config?.loading_label || DEFAULT_LOADING_MESSAGE);

    try {
      const response = await fetch('/api/n8n-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: requirement }),
      });

      if (!response.ok) {
        throw new Error(`request failed with status: ${response.status}`);
      }

      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.message || 'request failed');
      }

      setWorkflowJson(result.data.workflowJson);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'workflow generation failed';
      setError(message);
      setWorkflowJson(defaultWorkflowJson);
    } finally {
      setIsLoading(false);
    }
  }

  async function copyWorkflow() {
    await navigator.clipboard.writeText(formattedOutput);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1600);
  }

  function downloadWorkflow() {
    const blob = new Blob([formattedOutput], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'n8n-workflow.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="border-border/70 bg-background/95 mx-auto mt-8 w-full max-w-6xl overflow-hidden rounded-lg border shadow-2xl shadow-black/10 backdrop-blur md:mt-10">
      <div className="border-border/70 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-5">
        <div className="flex items-center gap-2">
          <span className="bg-foreground text-background flex size-7 items-center justify-center rounded-md">
            <WorkflowIcon className="size-4" />
          </span>
          <div className="text-left">
            <div className="text-sm font-medium">
              {config?.eyebrow ?? 'n8n Workflow AI'}
            </div>
            <div className="text-muted-foreground text-xs">
              GPT-5.5 · JSON export
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(config?.stats ?? []).map((stat) => (
            <Badge
              key={`${stat.value}-${stat.label}`}
              variant="outline"
              className="bg-background/70"
            >
              {stat.value} {stat.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid min-h-[430px] lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="border-border/70 flex flex-col border-b p-4 md:p-5 lg:border-r lg:border-b-0"
          onSubmit={(event) => {
            event.preventDefault();
            void generateWorkflow();
          }}
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <SparklesIcon className="size-4 text-emerald-600" />
            {config?.input_label ?? 'Automation request'}
          </div>

          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={config?.placeholder}
            className="min-h-[168px] resize-none border-0 bg-zinc-50 p-4 text-base shadow-none focus-visible:ring-1 md:text-sm dark:bg-zinc-950"
          />

          {samples.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {samples.slice(0, 3).map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setPrompt(sample)}
                  className={cn(
                    'border-border bg-background hover:bg-muted rounded-md border px-3 py-2 text-left text-xs transition-colors',
                    prompt === sample &&
                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  )}
                >
                  {sample}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="text-destructive mt-4 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm">
              {config?.error_prefix ?? 'Error'}: {error}
            </div>
          )}

          <div className="mt-auto pt-5">
            <Button
              type="submit"
              className="w-full gap-2"
              size="lg"
              disabled={!prompt.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SendHorizontalIcon className="size-4" />
              )}
              {isLoading
                ? (config?.loading_label ?? 'Generating')
                : (config?.submit_label ?? 'Generate workflow')}
            </Button>
          </div>
        </form>

        <div className="flex min-w-0 flex-col bg-zinc-950 text-zinc-100">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BracesIcon className="size-4 text-cyan-300" />
              {config?.output_label ?? 'Workflow JSON'}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-zinc-300 hover:bg-white/10 hover:text-white"
                onClick={copyWorkflow}
                aria-label={
                  isCopied ? config?.copied_label : config?.copy_label
                }
              >
                {isCopied ? (
                  <CheckIcon className="size-4 text-emerald-300" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-zinc-300 hover:bg-white/10 hover:text-white"
                onClick={downloadWorkflow}
                aria-label={config?.download_label}
              >
                <DownloadIcon className="size-4" />
              </Button>
            </div>
          </div>

          <div className="relative min-h-[360px] flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-linear-to-b from-zinc-950 to-transparent" />
            <pre className="h-full max-h-[470px] overflow-auto p-4 pt-5 text-left font-mono text-xs leading-6 text-zinc-200 md:p-5">
              {formattedOutput || config?.empty_output}
            </pre>
          </div>

          <div className="border-t border-white/10 px-4 py-3 text-left text-xs text-zinc-400 md:px-5">
            <span className="inline-flex items-center gap-2">
              <PlayIcon className="size-3 text-emerald-300" />
              n8n import-ready export
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
