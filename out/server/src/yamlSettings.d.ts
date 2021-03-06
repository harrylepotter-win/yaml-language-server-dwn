/// <reference types="node" />
import { TextDocuments, Disposable, ClientCapabilities, WorkspaceFolder } from 'vscode-languageserver/node';
import { CustomFormatterOptions, SchemaConfiguration } from './languageservice/yamlLanguageService';
import { ISchemaAssociations } from './requestTypes';
import { URI } from 'vscode-uri';
import { JSONSchema } from './languageservice/jsonSchema';
import { TextDocument } from 'vscode-languageserver-textdocument';
export interface Settings {
    yaml: {
        format: CustomFormatterOptions;
        schemas: JSONSchemaSettings[];
        validate: boolean;
        hover: boolean;
        completion: boolean;
        customTags: Array<string>;
        schemaStore: {
            url: string;
            enable: boolean;
        };
        disableAdditionalProperties: boolean;
        maxItemsComputed: number;
    };
    http: {
        proxy: string;
        proxyStrictSSL: boolean;
    };
    yamlEditor: {
        'editor.tabSize': number;
        'editor.insertSpaces': boolean;
        'editor.formatOnType': boolean;
    };
}
export interface JSONSchemaSettings {
    fileMatch?: string[];
    url?: string;
    schema?: JSONSchema;
}
export declare class SettingsState {
    yamlConfigurationSettings: JSONSchemaSettings[];
    schemaAssociations: ISchemaAssociations | SchemaConfiguration[] | undefined;
    formatterRegistration: Thenable<Disposable>;
    specificValidatorPaths: any[];
    schemaConfigurationSettings: any[];
    yamlShouldValidate: boolean;
    yamlFormatterSettings: CustomFormatterOptions;
    yamlShouldHover: boolean;
    yamlShouldCompletion: boolean;
    schemaStoreSettings: any[];
    customTags: any[];
    schemaStoreEnabled: boolean;
    schemaStoreUrl: string;
    indentation: string | undefined;
    disableAdditionalProperties: boolean;
    maxItemsComputed: number;
    pendingValidationRequests: {
        [uri: string]: NodeJS.Timer;
    };
    validationDelayMs: number;
    documents: TextDocuments<TextDocument> | TextDocumentTestManager;
    capabilities: ClientCapabilities;
    workspaceRoot: URI;
    workspaceFolders: WorkspaceFolder[];
    clientDynamicRegisterSupport: boolean;
    hierarchicalDocumentSymbolSupport: boolean;
    hasWorkspaceFolderCapability: boolean;
    hasConfigurationCapability: boolean;
    useVSCodeContentRequest: boolean;
}
export declare class TextDocumentTestManager extends TextDocuments<TextDocument> {
    testTextDocuments: Map<string, TextDocument>;
    constructor();
    get(uri: string): TextDocument | undefined;
    set(textDocument: TextDocument): void;
}
