function decodePythonStyleStringLiteral(value: string): string {
    return value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
}

function extractPythonStyleStringField(
    input: string,
    fieldName: string
): string | undefined {
    const escapedFieldName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = input.match(
        new RegExp(`${escapedFieldName}=('(?:\\\\.|[^'\\\\])*'|None|null)`)
    );

    if (!match) {
        return undefined;
    }

    const rawValue = match[1];
    if (rawValue === 'None' || rawValue === 'null') {
        return undefined;
    }

    return decodePythonStyleStringLiteral(rawValue.slice(1, -1));
}

function extractPythonStyleNumberField(
    input: string,
    fieldName: string
): number | undefined {
    const escapedFieldName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = input.match(new RegExp(`${escapedFieldName}=(-?[0-9]+)`));
    if (!match) {
        return undefined;
    }

    const numericValue = Number(match[1]);
    return Number.isFinite(numericValue) ? numericValue : undefined;
}

export type NormalizedOpenAIChunk = {
    id: string;
    object: 'chat.completion.chunk';
    created: number;
    model: string;
    choices: Array<{
        index: number;
        delta: {
            role: 'assistant';
            content?: string;
            reasoning_content?: string;
        };
        finish_reason: string;
    }>;
};

export function tryNormalizePythonStyleCompletionChunk(
    input: string,
    fallbackId: string,
    fallbackModel: string
): NormalizedOpenAIChunk | null {
    if (
        !input.includes('ChatCompletion') &&
        !input.includes('CompletionMessage(') &&
        !input.includes("role='assistant'")
    ) {
        return null;
    }

    const content = extractPythonStyleStringField(input, 'content');
    const reasoning =
        extractPythonStyleStringField(input, 'reasoning_content') ??
        extractPythonStyleStringField(input, 'reasoning');
    const finishReason =
        extractPythonStyleStringField(input, 'finish_reason') || 'stop';

    if (!content && !reasoning) {
        return null;
    }

    const index = extractPythonStyleNumberField(input, 'index') ?? 0;
    const chunkId =
        extractPythonStyleStringField(input, 'id') ||
        fallbackId ||
        `chatcmpl-${Date.now()}`;
    const model =
        extractPythonStyleStringField(input, 'model') ||
        fallbackModel ||
        'unknown';

    return {
        id: chunkId,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
            {
                index,
                delta: {
                    role: 'assistant',
                    ...(content ? { content } : {}),
                    ...(reasoning ? { reasoning_content: reasoning } : {})
                },
                finish_reason: finishReason
            }
        ]
    };
}
