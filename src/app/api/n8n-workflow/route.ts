import { generateId, UIMessage } from 'ai';

import { respData, respErr } from '@/shared/lib/resp';
import { getAllConfigs } from '@/shared/models/config';
import {
  createN8nWorkflowJson,
  getEvolinkConfig,
} from '@/shared/services/evolink';

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as { prompt?: string };
    const requirement = prompt?.trim();

    if (!requirement) {
      return respErr('prompt is required');
    }

    const configs = await getAllConfigs();
    const evolinkConfig = getEvolinkConfig(configs);

    if (!evolinkConfig.apiKey) {
      return respErr('evolink_api_key is not set');
    }

    const message: UIMessage = {
      id: generateId().toLowerCase(),
      role: 'user',
      parts: [
        {
          type: 'text',
          text: requirement,
        },
      ],
    };

    const workflowJson = await createN8nWorkflowJson({
      apiKey: evolinkConfig.apiKey,
      baseUrl: evolinkConfig.baseUrl,
      model: evolinkConfig.model,
      messages: [message],
    });

    return respData({ workflowJson });
  } catch (e: any) {
    console.log('n8n workflow generation failed:', e);
    return respErr(e.message || 'n8n workflow generation failed');
  }
}
