/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.YAMLDocumentSymbols = void 0;
const jsonDocumentSymbols_1 = require("vscode-json-languageservice/lib/umd/services/jsonDocumentSymbols");
const yaml_documents_1 = require("../parser/yaml-documents");
class YAMLDocumentSymbols {
    constructor(schemaService, telemetry) {
        this.telemetry = telemetry;
        this.jsonDocumentSymbols = new jsonDocumentSymbols_1.JSONDocumentSymbols(schemaService);
        const origKeyLabel = this.jsonDocumentSymbols.getKeyLabel;
        // override 'getKeyLabel' to handle complex mapping
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.jsonDocumentSymbols.getKeyLabel = (property) => {
            if (typeof property.keyNode.value === 'object') {
                return property.keyNode.value.value;
            }
            else {
                return origKeyLabel.call(this.jsonDocumentSymbols, property);
            }
        };
    }
    findDocumentSymbols(document, context = { resultLimit: Number.MAX_VALUE }) {
        let results = [];
        try {
            const doc = yaml_documents_1.yamlDocumentsCache.getYamlDocument(document);
            if (!doc || doc['documents'].length === 0) {
                return null;
            }
            for (const yamlDoc of doc['documents']) {
                if (yamlDoc.root) {
                    results = results.concat(this.jsonDocumentSymbols.findDocumentSymbols(document, yamlDoc, context));
                }
            }
        }
        catch (err) {
            this.telemetry.sendError('yaml.documentSymbols.error', { error: err, documentUri: document.uri });
        }
        return results;
    }
    findHierarchicalDocumentSymbols(document, context = { resultLimit: Number.MAX_VALUE }) {
        let results = [];
        try {
            const doc = yaml_documents_1.yamlDocumentsCache.getYamlDocument(document);
            if (!doc || doc['documents'].length === 0) {
                return null;
            }
            for (const yamlDoc of doc['documents']) {
                if (yamlDoc.root) {
                    results = results.concat(this.jsonDocumentSymbols.findDocumentSymbols2(document, yamlDoc, context));
                }
            }
        }
        catch (err) {
            this.telemetry.sendError('yaml.hierarchicalDocumentSymbols.error', { error: err, documentUri: document.uri });
        }
        return results;
    }
}
exports.YAMLDocumentSymbols = YAMLDocumentSymbols;
//# sourceMappingURL=documentSymbols.js.map