import axios from 'axios';

let activeModel =
  process.env.GROQ_MODEL && process.env.GROQ_MODEL !== 'llama-3.1-8b-instant'
    ? process.env.GROQ_MODEL
    : 'openai/gpt-oss-20b';

let cachedModels = null;

export function getActiveModel() {
  return activeModel;
}

export function setActiveModel(model) {
  if (model && typeof model === 'string') {
    activeModel = model;
  }
}

/**
 * Fetch available models from Groq to find an active fallback if model is decommissioned.
 */
async function discoverFallbackModel(apiKey) {
  try {
    const res = await axios.get('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 10000,
    });
    const modelList = res.data?.data || [];
    const modelIds = modelList.map((m) => m.id);
    cachedModels = modelIds;

    // Preference hierarchy for active chat models
    const preferred = [
      'openai/gpt-oss-20b',
      'openai/gpt-oss-120b',
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ];

    for (const pref of preferred) {
      if (modelIds.includes(pref)) {
        return pref;
      }
    }

    const candidate =
      modelIds.find((id) => !id.includes('whisper') && !id.includes('vision') && !id.includes('embed')) ||
      modelIds[0];
    return candidate || 'openai/gpt-oss-20b';
  } catch (err) {
    console.warn('[groqClient] Failed to fetch active models list:', err.message);
    return 'openai/gpt-oss-20b';
  }
}

/**
 * Call Groq chat completions API with timeout, retry, and model auto-recovery.
 * @param {Array<{role: string, content: string}>} messages
 * @param {Object} options
 * @returns {Promise<{content: string, model: string, usage: Object, latencyMs: number, raw: Object}>}
 */
export async function callGroqChat(messages, options = {}) {
  const apiKey = options.apiKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured on the backend.');
  }

  const model = options.model && options.model !== 'llama-3.1-8b-instant' ? options.model : activeModel;
  const temperature = options.temperature ?? 0.7;
  const max_tokens = options.max_tokens ?? 512;
  const timeout = options.timeout ?? 15000;

  const startTime = Date.now();

  const makeRequest = async (targetModel) => {
    return await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: targetModel,
        messages,
        temperature,
        max_tokens,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout,
      }
    );
  };

  try {
    const res = await makeRequest(model);
    const latencyMs = Date.now() - startTime;
    const choice = res.data?.choices?.[0];
    const content = choice?.message?.content ?? '';
    return {
      content,
      model,
      usage: res.data?.usage || {},
      latencyMs,
      raw: res.data,
    };
  } catch (err) {
    const status = err.response?.status;
    const errData = err.response?.data?.error;
    const errMsg = String(errData?.message || err.message || '');
    const isModelDeprecation =
      status === 400 ||
      status === 404 ||
      errMsg.includes('decommissioned') ||
      errMsg.includes('model_not_found') ||
      errMsg.includes('does not exist');

    if (isModelDeprecation && !options._retried) {
      console.warn(`[groqClient] Model ${model} failed (${errMsg}). Attempting auto-recovery...`);
      const fallback = await discoverFallbackModel(apiKey);
      if (fallback && fallback !== model) {
        activeModel = fallback;
        console.log(`[groqClient] Retrying with discovered active model: ${fallback}`);
        return await callGroqChat(messages, {
          ...options,
          model: fallback,
          _retried: true,
        });
      }
    }

    // Never silently fake a Groq reply—throw exact error message
    throw new Error(`Groq API Error (${status || 'network'}): ${errMsg || err.message}`);
  }
}
