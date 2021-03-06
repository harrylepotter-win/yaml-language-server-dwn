import { Connection } from 'vscode-languageserver';
import { LanguageService } from '../../languageservice/yamlLanguageService';
import { Settings, SettingsState } from '../../yamlSettings';
import { Telemetry } from '../telemetry';
import { ValidationHandler } from './validationHandlers';
export declare class SettingsHandler {
    private readonly connection;
    private readonly languageService;
    private readonly yamlSettings;
    private readonly validationHandler;
    private readonly telemetry;
    constructor(connection: Connection, languageService: LanguageService, yamlSettings: SettingsState, validationHandler: ValidationHandler, telemetry: Telemetry);
    registerHandlers(): Promise<void>;
    /**
     *  The server pull the 'yaml', 'http.proxy', 'http.proxyStrictSSL', '[yaml]' settings sections
     */
    pullConfiguration(): Promise<void>;
    setConfiguration(settings: Settings): void;
    /**
     * This function helps set the schema store if it hasn't already been set
     * AND the schema store setting is enabled. If the schema store setting
     * is not enabled we need to clear the schemas.
     */
    setSchemaStoreSettingsIfNotSet(): Promise<void>;
    /**
     * When the schema store is enabled, download and store YAML schema associations
     */
    private getSchemaStoreMatchingSchemas;
    /**
     * Called when server settings or schema associations are changed
     * Re-creates schema associations and re-validates any open YAML files
     */
    updateConfiguration(): void;
    /**
     * Stores schema associations in server settings, handling kubernetes
     * @param uri string path to schema (whether local or online)
     * @param fileMatch file pattern to apply the schema to
     * @param schema schema id
     * @param languageSettings current server settings
     */
    private configureSchemas;
}
