/*---------------------------------------------------------------------------------------------
 *  Completion Provider Registry
 *
 *  Central registry for FIM and NES engine factories used by InlineCompletionProvider.
 *  Keeps built-in provider wiring out of the core provider class so new engines can be
 *  registered with minimal changes.
 *--------------------------------------------------------------------------------------------*/

import {
    createInlineCompletionsProvider,
    createNESProvider,
    type IActionItem,
    type ICompletionsStatusChangedEvent,
    type ICompletionsStatusHandler,
    type IInlineCompletionsProvider,
    type INESProvider,
    type INESResult,
    type INotificationSender,
    type IURLOpener
} from '@vscode/chat-lib';
import { MutableObservableWorkspace } from '@vscode/chat-lib/dist/src/_internal/platform/inlineEdits/common/observableWorkspace';
import * as vscode from 'vscode';
import { VersionManager } from '../utils';
import { DocumentManager } from './documentManager';
import type { Fetcher } from './fetcher';
import type { CopilotLogTarget } from './logTarget';
import {
    type AuthenticationService,
    EndpointProvider,
    type TelemetrySender
} from './mockImpl';
import type { WorkspaceAdapter } from './workspaceAdapter';

export interface CompletionProviderFactoryContext {
    extensionContext: vscode.ExtensionContext;
    fetcher: Fetcher;
    logTarget: CopilotLogTarget;
    authService: AuthenticationService;
    telemetrySender: TelemetrySender;
}

export interface NESProviderFactoryContext
    extends CompletionProviderFactoryContext {
    workspaceAdapter: WorkspaceAdapter;
}

export type FIMProviderFactory = (
    context: CompletionProviderFactoryContext
) => IInlineCompletionsProvider;

export type NESProviderFactory = (
    context: NESProviderFactoryContext
) => INESProvider<INESResult>;

export const DEFAULT_FIM_PROVIDER_FACTORY_ID = 'chat-lib-default-fim';
export const DEFAULT_NES_PROVIDER_FACTORY_ID = 'chat-lib-default-nes';

const fimProviderFactories = new Map<string, FIMProviderFactory>();
const nesProviderFactories = new Map<string, NESProviderFactory>();

export function registerFIMProviderFactory(
    providerFactoryId: string,
    providerFactory: FIMProviderFactory
): void {
    fimProviderFactories.set(providerFactoryId, providerFactory);
}

export function registerNESProviderFactory(
    providerFactoryId: string,
    providerFactory: NESProviderFactory
): void {
    nesProviderFactories.set(providerFactoryId, providerFactory);
}

export function getRegisteredFIMProviderFactory(
    providerFactoryId: string
): FIMProviderFactory {
    const providerFactory = fimProviderFactories.get(providerFactoryId);
    if (!providerFactory) {
        throw new Error(`Unknown FIM provider factory: ${providerFactoryId}`);
    }
    return providerFactory;
}

export function getRegisteredNESProviderFactory(
    providerFactoryId: string
): NESProviderFactory {
    const providerFactory = nesProviderFactories.get(providerFactoryId);
    if (!providerFactory) {
        throw new Error(`Unknown NES provider factory: ${providerFactoryId}`);
    }
    return providerFactory;
}

export function listRegisteredFIMProviderFactories(): string[] {
    return [...fimProviderFactories.keys()];
}

export function listRegisteredNESProviderFactories(): string[] {
    return [...nesProviderFactories.keys()];
}

registerFIMProviderFactory(DEFAULT_FIM_PROVIDER_FACTORY_ID, (context) => {
    return createInlineCompletionsProvider({
        fetcher: context.fetcher,
        authService: context.authService,
        telemetrySender: context.telemetrySender,
        logTarget: context.logTarget,
        isRunningInTest: false,
        contextProviderMatch: async () => 0,
        statusHandler: new (class implements ICompletionsStatusHandler {
            didChange(_: ICompletionsStatusChangedEvent) {}
        })(),
        documentManager: new DocumentManager(),
        workspace: new MutableObservableWorkspace(),
        urlOpener: new (class implements IURLOpener {
            async open(_url: string) {}
        })(),
        editorInfo: { name: 'vscode', version: vscode.version },
        editorPluginInfo: {
            name: 'copilot-helper-pro',
            version: VersionManager.getVersion()
        },
        relatedPluginInfo: [],
        editorSession: {
            sessionId: `chp-session-${Date.now()}`,
            machineId: `chp-machine-${Math.random().toString(36).substring(7)}`
        },
        notificationSender: new (class implements INotificationSender {
            async showWarningMessage(
                _message: string,
                ..._items: IActionItem[]
            ) {
                return undefined;
            }
        })(),
        endpointProvider: new EndpointProvider()
    });
});

registerNESProviderFactory(DEFAULT_NES_PROVIDER_FACTORY_ID, (context) => {
    return createNESProvider({
        workspace: context.workspaceAdapter.getWorkspace(),
        fetcher: context.fetcher,
        copilotTokenManager: context.authService,
        telemetrySender: context.telemetrySender,
        logTarget: context.logTarget,
        waitForTreatmentVariables: false
    });
});
