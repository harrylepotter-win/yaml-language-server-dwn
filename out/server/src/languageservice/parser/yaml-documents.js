"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.yamlDocumentsCache = exports.YamlDocuments = void 0;
const arrUtils_1 = require("../utils/arrUtils");
const yamlParser07_1 = require("./yamlParser07");
class YamlDocuments {
    constructor() {
        // a mapping of URIs to cached documents
        this.cache = new Map();
    }
    /**
     * Get cached YAMLDocument
     * @param document TextDocument to parse
     * @param customTags YAML custom tags
     * @param addRootObject if true and document is empty add empty object {} to force schema usage
     * @returns the YAMLDocument
     */
    getYamlDocument(document, customTags = [], addRootObject = false) {
        this.ensureCache(document, customTags, addRootObject);
        return this.cache.get(document.uri).document;
    }
    /**
     * For test purpose only!
     */
    clear() {
        this.cache.clear();
    }
    ensureCache(document, customTags, addRootObject) {
        const key = document.uri;
        if (!this.cache.has(key)) {
            this.cache.set(key, { version: -1, document: new yamlParser07_1.YAMLDocument([]), customTags: [] });
        }
        const cacheEntry = this.cache.get(key);
        if (cacheEntry.version !== document.version || (customTags && !arrUtils_1.isArrayEqual(cacheEntry.customTags, customTags))) {
            let text = document.getText();
            // if text is contains only whitespace wrap all text in object to force schema selection
            if (addRootObject && !/\S/.test(text)) {
                text = `{${text}}`;
            }
            const doc = yamlParser07_1.parse(text, customTags);
            cacheEntry.document = doc;
            cacheEntry.version = document.version;
            cacheEntry.customTags = customTags;
        }
    }
}
exports.YamlDocuments = YamlDocuments;
exports.yamlDocumentsCache = new YamlDocuments();
//# sourceMappingURL=yaml-documents.js.map