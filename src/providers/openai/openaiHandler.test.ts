import { describe, expect, it } from 'vitest';

import { tryNormalizePythonStyleCompletionChunk } from './openaiSseNormalizer';

describe('tryNormalizePythonStyleCompletionChunk', () => {
    it('normalizes python-style completion dumps into OpenAI chunk JSON', () => {
        const payload = tryNormalizePythonStyleCompletionChunk(
            "ChatCompletion(id='chatcmpl-kilo', model='x-ai/grok-code-fast-1:optimized:free', choices=[Choice(finish_reason='stop', index=0, message=ChatCompletionMessage(content='Hello\\nMaslow\\'s ladder', refusal=None, role='assistant', annotations=None, audio=None, function_call=None, tool_calls=None, reasoning='plan first'))])",
            '',
            ''
        );

        expect(payload).not.toBeNull();
        if (!payload) {
            throw new Error('Expected normalized payload');
        }

        expect(payload.id).toBe('chatcmpl-kilo');
        expect(payload.model).toBe('x-ai/grok-code-fast-1:optimized:free');
        expect(payload.choices).toHaveLength(1);
        expect(payload.choices[0]).toMatchObject({
            index: 0,
            finish_reason: 'stop',
            delta: {
                role: 'assistant',
                content: "Hello\nMaslow's ladder",
                reasoning_content: 'plan first'
            }
        });
    });
});
