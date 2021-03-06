"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YamlCodeLens = void 0;
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const commands_1 = require("../../commands");
const yaml_documents_1 = require("../parser/yaml-documents");
const vscode_uri_1 = require("vscode-uri");
const path = require("path");
const objects_1 = require("../utils/objects");
class YamlCodeLens {
    constructor(schemaService, telemetry) {
        this.schemaService = schemaService;
        this.telemetry = telemetry;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getCodeLens(document, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const yamlDocument = yaml_documents_1.yamlDocumentsCache.getYamlDocument(document);
            const result = [];
            try {
                for (const currentYAMLDoc of yamlDocument.documents) {
                    const schema = yield this.schemaService.getSchemaForResource(document.uri, currentYAMLDoc);
                    if (schema === null || schema === void 0 ? void 0 : schema.schema) {
                        const schemaUrls = getSchemaUrl(schema === null || schema === void 0 ? void 0 : schema.schema);
                        if (schemaUrls.size === 0) {
                            continue;
                        }
                        for (const urlToSchema of schemaUrls) {
                            const lens = vscode_languageserver_types_1.CodeLens.create(vscode_languageserver_types_1.Range.create(0, 0, 0, 0));
                            lens.command = {
                                title: getCommandTitle(urlToSchema[0], urlToSchema[1]),
                                command: commands_1.YamlCommands.JUMP_TO_SCHEMA,
                                arguments: [urlToSchema[0]],
                            };
                            result.push(lens);
                        }
                    }
                }
            }
            catch (err) {
                this.telemetry.sendError('yaml.codeLens.error', { error: err, documentUri: document.uri });
            }
            return result;
        });
    }
    resolveCodeLens(param) {
        return param;
    }
}
exports.YamlCodeLens = YamlCodeLens;
function getCommandTitle(url, schema) {
    const uri = vscode_uri_1.URI.parse(url);
    let baseName = path.basename(uri.fsPath);
    if (!path.extname(uri.fsPath)) {
        baseName += '.json';
    }
    if (Object.getOwnPropertyDescriptor(schema, 'name')) {
        return Object.getOwnPropertyDescriptor(schema, 'name').value + ` (${baseName})`;
    }
    else if (schema.title) {
        return schema.title + ` (${baseName})`;
    }
    return baseName;
}
function getSchemaUrl(schema) {
    const result = new Map();
    if (!schema) {
        return result;
    }
    const url = schema.url;
    if (url) {
        if (url.startsWith('schemaservice://combinedSchema/')) {
            addSchemasForOf(schema, result);
        }
        else {
            result.set(schema.url, schema);
        }
    }
    else {
        addSchemasForOf(schema, result);
    }
    return result;
}
function addSchemasForOf(schema, result) {
    if (schema.allOf) {
        addInnerSchemaUrls(schema.allOf, result);
    }
    if (schema.anyOf) {
        addInnerSchemaUrls(schema.anyOf, result);
    }
    if (schema.oneOf) {
        addInnerSchemaUrls(schema.oneOf, result);
    }
}
function addInnerSchemaUrls(schemas, result) {
    for (const subSchema of schemas) {
        if (!objects_1.isBoolean(subSchema)) {
            if (subSchema.url && !result.has(subSchema.url)) {
                result.set(subSchema.url, subSchema);
            }
        }
    }
}
//# sourceMappingURL=yamlCodeLens.js.map