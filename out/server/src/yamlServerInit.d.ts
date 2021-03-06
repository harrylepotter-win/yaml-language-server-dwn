import { Connection, InitializeParams, InitializeResult } from 'vscode-languageserver/node';
import { LanguageService, SchemaRequestService, WorkspaceContextService } from './languageservice/yamlLanguageService';
import { SettingsState } from './yamlSettings';
import { LanguageHandlers } from './languageserver/handlers/languageHandlers';
import { ValidationHandler } from './languageserver/handlers/validationHandlers';
import { SettingsHandler } from './languageserver/handlers/settingsHandlers';
export declare class YAMLServerInit {
    private readonly connection;
    private yamlSettings;
    private workspaceContext;
    private schemaRequestService;
    languageService: LanguageService;
    languageHandler: LanguageHandlers;
    validationHandler: ValidationHandler;
    settingsHandler: SettingsHandler;
    private telemetry;
    constructor(connection: Connection, yamlSettings: SettingsState, workspaceContext: WorkspaceContextService, schemaRequestService: SchemaRequestService);
    connectionInitialized(params: InitializeParams): InitializeResult;
    private registerHandlers;
    start(): void;
}
