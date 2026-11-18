import { UIMessage } from 'ai';
import { config as loadEnvConfig } from 'dotenv';

import { Configs } from '@/shared/models/config';

const DEFAULT_EVOLINK_BASE_URL = 'https://direct.evolink.ai';
const DEFAULT_EVOLINK_MODEL = 'gpt-6.1-sol';

type EvolinkMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type EvolinkChatCompletionResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
  error?: {
    message?: string;
    type?: string;
  };
};

export const N8N_WORKFLOW_SYSTEM_PROMPT = [
  'You are an expert n8n workflow architect.',
  'Convert the user requirement into a single valid n8n workflow export JSON object.',
  'Return only JSON. Do not wrap it in Markdown. Do not add explanations.',
  'The JSON must be importable by n8n and should include: name, nodes, connections, settings, staticData, meta, pinData, versionId, triggerCount, and active.',
  'Every node must include id, name, type, typeVersion, position, and parameters.',
  'Use common n8n node types such as n8n-nodes-base.manualTrigger, n8n-nodes-base.webhook, n8n-nodes-base.httpRequest, n8n-nodes-base.set, n8n-nodes-base.if, n8n-nodes-base.code, n8n-nodes-base.noOp, and other built-in n8n nodes when suitable.',
  'Do not include real credentials, secrets, API keys, or private tokens. Use clear placeholder strings in parameters when external services are required.',
  'Prefer practical, minimal workflows that satisfy the requirement. If details are missing, make conservative assumptions and express unresolved values as placeholders.',
].join('\n');

export function getEvolinkConfig(configs: Configs) {
  if (typeof window === 'undefined' && !process.env.EVOLINK_API_KEY) {
    loadEnvConfig({ path: '.env.development' });
  }

  return {
    apiKey: configs.evolink_api_key || process.env.EVOLINK_API_KEY || '',
    baseUrl:
      configs.evolink_base_url ||
      process.env.EVOLINK_BASE_URL ||
      DEFAULT_EVOLINK_BASE_URL,
    model: configs.evolink_model || DEFAULT_EVOLINK_MODEL,
  };
}

export function getMessageText(message: UIMessage) {
  return message.parts
    ?.map((part) => {
      if (part.type === 'text') {
        return part.text;
      }

      return '';
    })
    .filter(Boolean)
    .join('\n')
    .trim();
}

export function buildN8nWorkflowMessages(messages: UIMessage[]) {
  const conversationMessages = messages
    .map((message): EvolinkMessage | null => {
      const content = getMessageText(message);
      if (!content) {
        return null;
      }

      return {
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content,
      };
    })
    .filter((message): message is EvolinkMessage => Boolean(message));

  return [
    {
      role: 'system',
      content: N8N_WORKFLOW_SYSTEM_PROMPT,
    },
    ...conversationMessages,
  ] satisfies EvolinkMessage[];
}

export async function createN8nWorkflowJson({
  apiKey,
  baseUrl,
  model,
  messages,
}: {
  apiKey: string;
  baseUrl: string;
  model?: string;
  messages: UIMessage[];
}) {
  if (!apiKey) {
    throw new Error('evolink_api_key is not set');
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || DEFAULT_EVOLINK_MODEL,
      messages: buildN8nWorkflowMessages(messages),
    }),
  });

  const data = (await response
    .json()
    .catch(() => null)) as EvolinkChatCompletionResponse | null;

  if (!response.ok) {
    const message =
      data?.error?.message || `Evolink request failed: ${response.status}`;
    throw new Error(message);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Evolink response is empty');
  }

  return normalizeN8nWorkflowJson(content);
}

function normalizeN8nWorkflowJson(content: string) {
  const jsonText = extractJsonObject(content);
  const workflow = JSON.parse(jsonText);

  if (!workflow || typeof workflow !== 'object') {
    throw new Error('model output is not a JSON object');
  }

  if (!Array.isArray(workflow.nodes)) {
    throw new Error('model output is missing nodes array');
  }

  if (!workflow.connections || typeof workflow.connections !== 'object') {
    throw new Error('model output is missing connections object');
  }

  return JSON.stringify(workflow, null, 2);
}

function extractJsonObject(content: string) {
  let text = content.trim();

  const fencedJson = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedJson?.[1]) {
    text = fencedJson[1].trim();
  }

  try {
    JSON.parse(text);
    return text;
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
      throw new Error('model output does not contain valid JSON');
    }

    return text.slice(start, end + 1);
  }
}
