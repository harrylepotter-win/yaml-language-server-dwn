"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLanguageService = exports.SchemaPriority = void 0;
const yamlSchemaService_1 = require("./services/yamlSchemaService");
const documentSymbols_1 = require("./services/documentSymbols");
const yamlCompletion_1 = require("./services/yamlCompletion");
const yamlHover_1 = require("./services/yamlHover");
const yamlValidation_1 = require("./services/yamlValidation");
const yamlFormatter_1 = require("./services/yamlFormatter");
const yamlLinks_1 = require("./services/yamlLinks");
const yamlFolding_1 = require("./services/yamlFolding");
const yamlCodeActions_1 = require("./services/yamlCodeActions");
const commandExecutor_1 = require("../languageserver/commandExecutor");
const yamlOnTypeFormatting_1 = require("./services/yamlOnTypeFormatting");
const yamlCodeLens_1 = require("./services/yamlCodeLens");
const yamlCommands_1 = require("./services/yamlCommands");
var SchemaPriority;
(function (SchemaPriority) {
    SchemaPriority[SchemaPriority["SchemaStore"] = 1] = "SchemaStore";
    SchemaPriority[SchemaPriority["SchemaAssociation"] = 2] = "SchemaAssociation";
    SchemaPriority[SchemaPriority["Settings"] = 3] = "Settings";
    SchemaPriority[SchemaPriority["Modeline"] = 4] = "Modeline";
})(SchemaPriority = exports.SchemaPriority || (exports.SchemaPriority = {}));
function getLanguageService(schemaRequestService, workspaceContext, connection, telemetry, clientCapabilities) {
    const schemaService = new yamlSchemaService_1.YAMLSchemaService(schemaRequestService, workspaceContext);
    const completer = new yamlCompletion_1.YAMLCompletion(schemaService, clientCapabilities, telemetry);
    const hover = new yamlHover_1.YAMLHover(schemaService);
    const yamlDocumentSymbols = new documentSymbols_1.YAMLDocumentSymbols(schemaService, telemetry);
    const yamlValidation = new yamlValidation_1.YAMLValidation(schemaService);
    const formatter = new yamlFormatter_1.YAMLFormatter();
    const yamlCodeActions = new yamlCodeActions_1.YamlCodeActions(clientCapabilities);
    const yamlCodeLens = new yamlCodeLens_1.YamlCodeLens(schemaService, telemetry);
    // register all commands
    yamlCommands_1.registerCommands(commandExecutor_1.commandExecutor, connection);
    return {
        configure: (settings) => {
            schemaService.clearExternalSchemas();
            if (settings.schemas) {
                schemaService.schemaPriorityMapping = new Map();
                settings.schemas.forEach((settings) => {
                    const currPriority = settings.priority ? settings.priority : 0;
                    schemaService.addSchemaPriority(settings.uri, currPriority);
                    schemaService.registerExternalSchema(settings.uri, settings.fileMatch, settings.schema);
                });
            }
            yamlValidation.configure(settings);
            hover.configure(settings);
            const customTagsSetting = settings && settings['customTags'] ? settings['customTags'] : [];
            completer.configure(settings, customTagsSetting);
            formatter.configure(settings);
            yamlCodeActions.configure(settings);
        },
        registerCustomSchemaProvider: (schemaProvider) => {
            schemaService.registerCustomSchemaProvider(schemaProvider);
        },
        findDefinition: () => Promise.resolve([]),
        findLinks: yamlLinks_1.findLinks,
        doComplete: completer.doComplete.bind(completer),
        doValidation: yamlValidation.doValidation.bind(yamlValidation),
        doHover: hover.doHover.bind(hover),
        findDocumentSymbols: yamlDocumentSymbols.findDocumentSymbols.bind(yamlDocumentSymbols),
        findDocumentSymbols2: yamlDocumentSymbols.findHierarchicalDocumentSymbols.bind(yamlDocumentSymbols),
        resetSchema: (uri) => {
            return schemaService.onResourceChange(uri);
        },
        doFormat: formatter.format.bind(formatter),
        doDocumentOnTypeFormatting: yamlOnTypeFormatting_1.doDocumentOnTypeFormatting,
        addSchema: (schemaID, schema) => {
            return schemaService.saveSchema(schemaID, schema);
        },
        deleteSchema: (schemaID) => {
            return schemaService.deleteSchema(schemaID);
        },
        modifySchemaContent: (schemaAdditions) => {
            return schemaService.addContent(schemaAdditions);
        },
        deleteSchemaContent: (schemaDeletions) => {
            return schemaService.deleteContent(schemaDeletions);
        },
        deleteSchemasWhole: (schemaDeletions) => {
            return schemaService.deleteSchemas(schemaDeletions);
        },
        getFoldingRanges: yamlFolding_1.getFoldingRanges,
        getCodeAction: (document, params) => {
            return yamlCodeActions.getCodeAction(document, params);
        },
        getCodeLens: (document, params) => {
            return yamlCodeLens.getCodeLens(document, params);
        },
        resolveCodeLens: (param) => yamlCodeLens.resolveCodeLens(param),
    };
}
exports.getLanguageService = getLanguageService;
//# sourceMappingURL=yamlLanguageService.js.map