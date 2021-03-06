/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
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
exports.YAMLValidation = exports.yamlDiagToLSDiag = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const jsonValidation_1 = require("vscode-json-languageservice/lib/umd/services/jsonValidation");
const jsonParser07_1 = require("../parser/jsonParser07");
const textBuffer_1 = require("../utils/textBuffer");
const yaml_documents_1 = require("../parser/yaml-documents");
/**
 * Convert a YAMLDocDiagnostic to a language server Diagnostic
 * @param yamlDiag A YAMLDocDiagnostic from the parser
 * @param textDocument TextDocument from the language server client
 */
exports.yamlDiagToLSDiag = (yamlDiag, textDocument) => {
    const start = textDocument.positionAt(yamlDiag.location.start);
    const range = {
        start,
        end: yamlDiag.location.toLineEnd
            ? vscode_languageserver_1.Position.create(start.line, new textBuffer_1.TextBuffer(textDocument).getLineLength(yamlDiag.location.start))
            : textDocument.positionAt(yamlDiag.location.end),
    };
    return vscode_languageserver_1.Diagnostic.create(range, yamlDiag.message, yamlDiag.severity, yamlDiag.code, jsonParser07_1.YAML_SOURCE);
};
class YAMLValidation {
    constructor(schemaService) {
        this.MATCHES_MULTIPLE = 'Matches multiple schemas when only one must validate.';
        this.validationEnabled = true;
        this.jsonValidation = new jsonValidation_1.JSONValidation(schemaService, Promise);
    }
    configure(settings) {
        if (settings) {
            this.validationEnabled = settings.validate;
            this.customTags = settings.customTags;
            this.disableAdditionalProperties = settings.disableAdditionalProperties;
        }
    }
    doValidation(textDocument, isKubernetes = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.validationEnabled) {
                return Promise.resolve([]);
            }
            const yamlDocument = yaml_documents_1.yamlDocumentsCache.getYamlDocument(textDocument, this.customTags, true);
            const validationResult = [];
            let index = 0;
            for (const currentYAMLDoc of yamlDocument.documents) {
                currentYAMLDoc.isKubernetes = isKubernetes;
                currentYAMLDoc.currentDocIndex = index;
                currentYAMLDoc.disableAdditionalProperties = this.disableAdditionalProperties;
                const validation = yield this.jsonValidation.doValidation(textDocument, currentYAMLDoc);
                const syd = currentYAMLDoc;
                if (syd.errors.length > 0) {
                    // TODO: Get rid of these type assertions (shouldn't need them)
                    validationResult.push(...syd.errors);
                }
                if (syd.warnings.length > 0) {
                    validationResult.push(...syd.warnings);
                }
                validationResult.push(...validation);
                index++;
            }
            let previousErr;
            const foundSignatures = new Set();
            const duplicateMessagesRemoved = [];
            for (let err of validationResult) {
                /**
                 * A patch ontop of the validation that removes the
                 * 'Matches many schemas' error for kubernetes
                 * for a better user experience.
                 */
                if (isKubernetes && err.message === this.MATCHES_MULTIPLE) {
                    continue;
                }
                if (Object.prototype.hasOwnProperty.call(err, 'location')) {
                    err = exports.yamlDiagToLSDiag(err, textDocument);
                }
                if (!err.source) {
                    err.source = jsonParser07_1.YAML_SOURCE;
                }
                if (previousErr &&
                    previousErr.message === err.message &&
                    previousErr.range.end.line === err.range.start.line &&
                    Math.abs(previousErr.range.end.character - err.range.end.character) >= 1) {
                    previousErr.range.end = err.range.end;
                    continue;
                }
                else {
                    previousErr = err;
                }
                const errSig = err.range.start.line + ' ' + err.range.start.character + ' ' + err.message;
                if (!foundSignatures.has(errSig)) {
                    duplicateMessagesRemoved.push(err);
                    foundSignatures.add(errSig);
                }
            }
            return duplicateMessagesRemoved;
        });
    }
}
exports.YAMLValidation = YAMLValidation;
//# sourceMappingURL=yamlValidation.js.map