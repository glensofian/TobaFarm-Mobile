import { LlamaContext } from 'llama.rn';
import { loadLocalModel } from './modelDownloader';
import type { LLM, Message } from 'react-native-rag';

export class LlamaRNWrapper implements LLM {
  private context?: LlamaContext;

  async load(): Promise<this> {
    const result = await loadLocalModel();
    if (!result.success || !result.context) {
      throw new Error(result.error || "Failed to load llama.rn model. Is it downloaded?");
    }
    this.context = result.context;
    return this;
  }

  async interrupt(): Promise<void> {
    if (this.context) {
      await this.context.stopCompletion();
    }
  }

  async unload(): Promise<void> {
    if (this.context) {
      // llama.rn doesn't have an explicit unload exposed in all versions, 
      // but release is typically available on context or handled naturally.
      // If release exists, we call it.
      if (typeof (this.context as any).release === 'function') {
        await (this.context as any).release();
      }
      this.context = undefined;
    }
  }

  async generate(messages: Message[], callback: (token: string) => void): Promise<string> {
    if (!this.context) throw new Error("Model not loaded");

    // Convert react-native-rag messages to llama.rn format
    const llamaMessages = messages.map(m => ({
      role: m.role === 'user' ? 'user' : (m.role === 'assistant' ? 'assistant' : 'system'),
      content: m.content
    }));

    const result = await this.context.completion(
      {
        messages: llamaMessages,
        n_predict: 512,
        temperature: 0.7,
      },
      (data) => {
        if (data.token) {
          callback(data.token);
        }
      }
    );

    return result.text || "";
  }
}
