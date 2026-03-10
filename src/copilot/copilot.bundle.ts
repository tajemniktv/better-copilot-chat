/*---------------------------------------------------------------------------------------------
 *  Copilot Bundle - Lazy loading entry point
 *
 *  This file serves as an independent bundle entry point, containing heavy dependencies like @vscode/chat-lib.
 *  Dynamically loaded by InlineCompletionShim on first inline completion trigger.
 *
 *  Build output: dist/copilot.bundle.js
 *--------------------------------------------------------------------------------------------*/

// Export provider factory used by the lightweight shim
export { createInlineCompletionProvider } from './completionProvider';
export {
    DEFAULT_FIM_PROVIDER_FACTORY_ID,
    DEFAULT_NES_PROVIDER_FACTORY_ID,
    listRegisteredFIMProviderFactories,
    listRegisteredNESProviderFactories,
    registerFIMProviderFactory,
    registerNESProviderFactory
} from './completionProviderRegistry';
