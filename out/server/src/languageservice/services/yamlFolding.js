"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFoldingRanges = void 0;
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const vscode_languageserver_1 = require("vscode-languageserver");
const yaml_documents_1 = require("../parser/yaml-documents");
function getFoldingRanges(document, context) {
    if (!document) {
        return;
    }
    const result = [];
    const doc = yaml_documents_1.yamlDocumentsCache.getYamlDocument(document);
    for (const ymlDoc of doc.documents) {
        ymlDoc.visit((node) => {
            var _a;
            if ((node.type === 'property' && node.valueNode.type === 'array') ||
                (node.type === 'object' && ((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type) === 'array')) {
                result.push(creteNormalizedFolding(document, node));
            }
            if (node.type === 'property' && node.valueNode.type === 'object') {
                result.push(creteNormalizedFolding(document, node));
            }
            return true;
        });
    }
    const rangeLimit = context && context.rangeLimit;
    if (typeof rangeLimit !== 'number' || result.length <= rangeLimit) {
        return result;
    }
    if (context && context.onRangeLimitExceeded) {
        context.onRangeLimitExceeded(document.uri);
    }
    return result.slice(0, context.rangeLimit);
}
exports.getFoldingRanges = getFoldingRanges;
function creteNormalizedFolding(document, node) {
    const startPos = document.positionAt(node.offset);
    let endPos = document.positionAt(node.offset + node.length);
    const textFragment = document.getText(vscode_languageserver_1.Range.create(startPos, endPos));
    const newLength = textFragment.length - textFragment.trimRight().length;
    if (newLength > 0) {
        endPos = document.positionAt(node.offset + node.length - newLength);
    }
    return vscode_languageserver_1.FoldingRange.create(startPos.line, endPos.line, startPos.character, endPos.character);
}
//# sourceMappingURL=yamlFolding.js.map