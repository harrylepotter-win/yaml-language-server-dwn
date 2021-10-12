"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextDocumentTestManager = exports.SettingsState = void 0;
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const schemaUrls_1 = require("./languageservice/utils/schemaUrls");
// This class is responsible for handling all the settings
class SettingsState {
    constructor() {
        this.yamlConfigurationSettings = undefined;
        this.schemaAssociations = undefined;
        this.formatterRegistration = null;
        this.specificValidatorPaths = [];
        this.schemaConfigurationSettings = [];
        this.yamlShouldValidate = true;
        this.yamlFormatterSettings = {
            singleQuote: false,
            bracketSpacing: true,
            proseWrap: 'preserve',
            printWidth: 80,
            enable: true,
        };
        this.yamlShouldHover = true;
        this.yamlShouldCompletion = true;
        this.schemaStoreSettings = [];
        this.customTags = [];
        this.schemaStoreEnabled = true;
        this.schemaStoreUrl = schemaUrls_1.JSON_SCHEMASTORE_URL;
        this.indentation = undefined;
        this.disableAdditionalProperties = false;
        this.maxItemsComputed = 5000;
        // File validation helpers
        this.pendingValidationRequests = {};
        this.validationDelayMs = 200;
        // Create a simple text document manager. The text document manager
        // supports full document sync only
        this.documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
        this.workspaceRoot = null;
        this.workspaceFolders = [];
        this.clientDynamicRegisterSupport = false;
        this.hierarchicalDocumentSymbolSupport = false;
        this.hasWorkspaceFolderCapability = false;
        this.hasConfigurationCapability = false;
        this.useVSCodeContentRequest = false;
    }
}
exports.SettingsState = SettingsState;
class TextDocumentTestManager extends node_1.TextDocuments {
    constructor() {
        super(vscode_languageserver_textdocument_1.TextDocument);
        this.testTextDocuments = new Map();
    }
    get(uri) {
        return this.testTextDocuments.get(uri);
    }
    set(textDocument) {
        this.testTextDocuments.set(textDocument.uri, textDocument);
    }
}
exports.TextDocumentTestManager = TextDocumentTestManager;
//# sourceMappingURL=yamlSettings.js.map