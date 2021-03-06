/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.YAMLCompletion = void 0;
const yamlParser07_1 = require("../parser/yamlParser07");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const nls = require("vscode-nls");
const arrUtils_1 = require("../utils/arrUtils");
const jsonCompletion_1 = require("vscode-json-languageservice/lib/umd/services/jsonCompletion");
const json_1 = require("../utils/json");
const indentationGuesser_1 = require("../utils/indentationGuesser");
const textBuffer_1 = require("../utils/textBuffer");
const isKubernetes_1 = require("../parser/isKubernetes");
const localize = nls.loadMessageBundle();
const doubleQuotesEscapeRegExp = /[\\]+"/g;
class YAMLCompletion extends jsonCompletion_1.JSONCompletion {
    constructor(schemaService, clientCapabilities = {}, telemetry) {
        super(schemaService, [], Promise, clientCapabilities);
        this.telemetry = telemetry;
        this.schemaService = schemaService;
        this.customTags = [];
        this.completion = true;
    }
    configure(languageSettings, customTags) {
        if (languageSettings) {
            this.completion = languageSettings.completion;
        }
        this.customTags = customTags;
        this.configuredIndentation = languageSettings.indentation;
    }
    doComplete(document, position, isKubernetes = false) {
        const result = {
            items: [],
            isIncomplete: false,
        };
        if (!this.completion) {
            return Promise.resolve(result);
        }
        const originalPosition = vscode_languageserver_types_1.Position.create(position.line, position.character);
        const completionFix = this.completionHelper(document, position);
        const newText = completionFix.newText;
        const doc = yamlParser07_1.parse(newText);
        const textBuffer = new textBuffer_1.TextBuffer(document);
        if (!this.configuredIndentation) {
            const indent = indentationGuesser_1.guessIndentation(textBuffer, 2, true);
            this.indentation = indent.insertSpaces ? ' '.repeat(indent.tabSize) : '\t';
        }
        else {
            this.indentation = this.configuredIndentation;
        }
        isKubernetes_1.setKubernetesParserOption(doc.documents, isKubernetes);
        const offset = document.offsetAt(position);
        if (document.getText()[offset] === ':') {
            return Promise.resolve(result);
        }
        const currentDoc = arrUtils_1.matchOffsetToDocument(offset, doc);
        if (currentDoc === null) {
            return Promise.resolve(result);
        }
        const currentDocIndex = doc.documents.indexOf(currentDoc);
        let node = currentDoc.getNodeFromOffsetEndInclusive(offset);
        // if (this.isInComment(document, node ? node.start : 0, offset)) {
        // 	return Promise.resolve(result);
        // }
        const currentWord = super.getCurrentWord(document, offset);
        let overwriteRange = null;
        if (node && node.type === 'null') {
            const nodeStartPos = document.positionAt(node.offset);
            nodeStartPos.character += 1;
            const nodeEndPos = document.positionAt(node.offset + node.length);
            nodeEndPos.character += 1;
            overwriteRange = vscode_languageserver_types_1.Range.create(nodeStartPos, nodeEndPos);
        }
        else if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean')) {
            overwriteRange = vscode_languageserver_types_1.Range.create(document.positionAt(node.offset), document.positionAt(node.offset + node.length));
        }
        else {
            let overwriteStart = document.offsetAt(originalPosition) - currentWord.length;
            if (overwriteStart > 0 && document.getText()[overwriteStart - 1] === '"') {
                overwriteStart--;
            }
            overwriteRange = vscode_languageserver_types_1.Range.create(document.positionAt(overwriteStart), originalPosition);
        }
        const proposed = {};
        const collector = {
            add: (suggestion) => {
                let label = suggestion.label;
                const existing = proposed[label];
                if (!existing) {
                    label = label.replace(/[\n]/g, '???');
                    if (label.length > 60) {
                        const shortendedLabel = label.substr(0, 57).trim() + '...';
                        if (!proposed[shortendedLabel]) {
                            label = shortendedLabel;
                        }
                    }
                    if (overwriteRange && overwriteRange.start.line === overwriteRange.end.line) {
                        suggestion.textEdit = vscode_languageserver_types_1.TextEdit.replace(overwriteRange, suggestion.insertText);
                    }
                    suggestion.label = label;
                    proposed[label] = suggestion;
                    result.items.push(suggestion);
                }
                else if (!existing.documentation) {
                    existing.documentation = suggestion.documentation;
                }
            },
            setAsIncomplete: () => {
                result.isIncomplete = true;
            },
            error: (message) => {
                console.error(message);
                this.telemetry.sendError('yaml.completion.error', { error: message });
            },
            log: (message) => {
                console.log(message);
            },
            getNumberOfProposals: () => {
                return result.items.length;
            },
        };
        if (this.customTags.length > 0) {
            this.getCustomTagValueCompletions(collector);
        }
        currentDoc.currentDocIndex = currentDocIndex;
        return this.schemaService.getSchemaForResource(document.uri, currentDoc).then((schema) => {
            if (!schema || schema.errors.length) {
                return Promise.resolve(result);
            }
            const newSchema = schema;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const collectionPromises = [];
            let addValue = true;
            let currentProperty = null;
            if (node) {
                if (node.type === 'string') {
                    const parent = node.parent;
                    if (parent && parent.type === 'property' && parent.keyNode === node) {
                        addValue = !parent.valueNode;
                        currentProperty = parent;
                        if (parent) {
                            node = parent.parent;
                        }
                    }
                }
                if (node.type === 'null') {
                    const parent = node.parent;
                    if (parent && parent.type === 'property' && parent.valueNode === node) {
                        addValue = !parent.valueNode;
                        currentProperty = parent;
                        if (parent) {
                            node = parent;
                        }
                    }
                }
            }
            // proposals for properties
            if (node && node.type === 'object') {
                // don't suggest properties that are already present
                const properties = node.properties;
                properties.forEach((p) => {
                    if (!currentProperty || currentProperty !== p) {
                        proposed[p.keyNode.value] = vscode_languageserver_types_1.CompletionItem.create('__');
                    }
                });
                const separatorAfter = '';
                if (newSchema) {
                    // property proposals with schema
                    this.getPropertyCompletions(newSchema, currentDoc, node, addValue, separatorAfter, collector, textBuffer, overwriteRange);
                }
                if (!schema && currentWord.length > 0 && document.getText().charAt(offset - currentWord.length - 1) !== '"') {
                    collector.add({
                        kind: vscode_languageserver_types_1.CompletionItemKind.Property,
                        label: currentWord,
                        insertText: this.getInsertTextForProperty(currentWord, null, false, separatorAfter),
                        insertTextFormat: vscode_languageserver_types_1.InsertTextFormat.Snippet,
                        documentation: '',
                    });
                }
            }
            // proposals for values
            const types = {};
            if (newSchema) {
                this.getValueCompletions(newSchema, currentDoc, node, offset, document, collector, types);
            }
            return Promise.all(collectionPromises).then(() => {
                return result;
            });
        });
    }
    getPropertyCompletions(schema, doc, node, addValue, separatorAfter, collector, textBuffer, overwriteRange) {
        const matchingSchemas = doc.getMatchingSchemas(schema.schema);
        const existingKey = textBuffer.getText(overwriteRange);
        const hasColumn = textBuffer.getLineContent(overwriteRange.start.line).indexOf(':') === -1;
        matchingSchemas.forEach((s) => {
            if (s.node === node && !s.inverted) {
                this.collectDefaultSnippets(s.schema, separatorAfter, collector, {
                    newLineFirst: false,
                    indentFirstObject: false,
                    shouldIndentWithTab: false,
                });
                const schemaProperties = s.schema.properties;
                if (schemaProperties) {
                    const maxProperties = s.schema.maxProperties;
                    if (maxProperties === undefined || node.properties === undefined || node.properties.length <= maxProperties) {
                        Object.keys(schemaProperties).forEach((key) => {
                            const propertySchema = schemaProperties[key];
                            if (typeof propertySchema === 'object' && !propertySchema.deprecationMessage && !propertySchema['doNotSuggest']) {
                                let identCompensation = '';
                                if (node.parent && node.parent.type === 'array' && node.properties.length <= 1) {
                                    // because there is a slash '-' to prevent the properties generated to have the correct
                                    // indent
                                    const sourceText = textBuffer.getText();
                                    const indexOfSlash = sourceText.lastIndexOf('-', node.offset - 1);
                                    if (indexOfSlash >= 0) {
                                        // add one space to compensate the '-'
                                        identCompensation = ' ' + sourceText.slice(indexOfSlash + 1, node.offset);
                                    }
                                }
                                let insertText = key;
                                if (!key.startsWith(existingKey) || hasColumn) {
                                    insertText = this.getInsertTextForProperty(key, propertySchema, addValue, separatorAfter, identCompensation + this.indentation);
                                }
                                collector.add({
                                    kind: vscode_languageserver_types_1.CompletionItemKind.Property,
                                    label: key,
                                    insertText,
                                    insertTextFormat: vscode_languageserver_types_1.InsertTextFormat.Snippet,
                                    documentation: super.fromMarkup(propertySchema.markdownDescription) || propertySchema.description || '',
                                });
                            }
                        });
                    }
                }
                // Error fix
                // If this is a array of string/boolean/number
                //  test:
                //    - item1
                // it will treated as a property key since `:` has been appended
                if (node.type === 'object' && node.parent && node.parent.type === 'array' && s.schema.type !== 'object') {
                    this.addSchemaValueCompletions(s.schema, separatorAfter, collector, {});
                }
            }
            if (node.parent && s.node === node.parent && node.type === 'object' && s.schema.defaultSnippets) {
                // For some reason the first item in the array needs to be treated differently, otherwise
                // the indentation will not be correct
                if (node.properties.length === 1) {
                    this.collectDefaultSnippets(s.schema, separatorAfter, collector, {
                        newLineFirst: false,
                        indentFirstObject: false,
                        shouldIndentWithTab: true,
                    }, 1);
                }
                else {
                    this.collectDefaultSnippets(s.schema, separatorAfter, collector, {
                        newLineFirst: false,
                        indentFirstObject: true,
                        shouldIndentWithTab: false,
                    }, 1);
                }
            }
        });
    }
    getValueCompletions(schema, doc, node, offset, document, collector, types) {
        let parentKey = null;
        if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean')) {
            node = node.parent;
        }
        if (node && node.type === 'null') {
            const nodeParent = node.parent;
            /*
             * This is going to be an object for some reason and we need to find the property
             * Its an issue with the null node
             */
            if (nodeParent && nodeParent.type === 'object') {
                for (const prop in nodeParent['properties']) {
                    const currNode = nodeParent['properties'][prop];
                    if (currNode.keyNode && currNode.keyNode.value === node.location) {
                        node = currNode;
                    }
                }
            }
        }
        if (!node) {
            this.addSchemaValueCompletions(schema.schema, '', collector, types);
            return;
        }
        if (node.type === 'property' && offset > node.colonOffset) {
            const valueNode = node.valueNode;
            if (valueNode && offset > valueNode.offset + valueNode.length) {
                return; // we are past the value node
            }
            parentKey = node.keyNode.value;
            node = node.parent;
        }
        if (node && (parentKey !== null || node.type === 'array')) {
            const separatorAfter = '';
            const matchingSchemas = doc.getMatchingSchemas(schema.schema);
            matchingSchemas.forEach((s) => {
                if (s.node === node && !s.inverted && s.schema) {
                    if (s.schema.items) {
                        this.collectDefaultSnippets(s.schema, separatorAfter, collector, {
                            newLineFirst: false,
                            indentFirstObject: false,
                            shouldIndentWithTab: false,
                        });
                        if (Array.isArray(s.schema.items)) {
                            const index = super.findItemAtOffset(node, document, offset);
                            if (index < s.schema.items.length) {
                                this.addSchemaValueCompletions(s.schema.items[index], separatorAfter, collector, types);
                            }
                        }
                        else if (typeof s.schema.items === 'object' && s.schema.items.type === 'object') {
                            collector.add({
                                kind: super.getSuggestionKind(s.schema.items.type),
                                label: '- (array item)',
                                documentation: `Create an item of an array${s.schema.description === undefined ? '' : '(' + s.schema.description + ')'}`,
                                insertText: `- ${this.getInsertTextForObject(s.schema.items, separatorAfter, '  ').insertText.trimLeft()}`,
                                insertTextFormat: vscode_languageserver_types_1.InsertTextFormat.Snippet,
                            });
                            this.addSchemaValueCompletions(s.schema.items, separatorAfter, collector, types);
                        }
                        else if (typeof s.schema.items === 'object' && s.schema.items.anyOf) {
                            s.schema.items.anyOf
                                .filter((i) => typeof i === 'object')
                                .forEach((i, index) => {
                                const insertText = `- ${this.getInsertTextForObject(i, separatorAfter).insertText.trimLeft()}`;
                                //append insertText to documentation
                                const documentation = this.getDocumentationWithMarkdownText(`Create an item of an array${s.schema.description === undefined ? '' : '(' + s.schema.description + ')'}`, insertText);
                                collector.add({
                                    kind: super.getSuggestionKind(i.type),
                                    label: '- (array item) ' + (index + 1),
                                    documentation: documentation,
                                    insertText: insertText,
                                    insertTextFormat: vscode_languageserver_types_1.InsertTextFormat.Snippet,
                                });
                            });
                            this.addSchemaValueCompletions(s.schema.items, separatorAfter, collector, types);
                        }
                        else {
                            this.addSchemaValueCompletions(s.schema.items, separatorAfter, collector, types);
                        }
                    }
                    if (s.schema.properties) {
                        const propertySchema = s.schema.properties[parentKey];
                        if (propertySchema) {
                            this.addSchemaValueCompletions(propertySchema, separatorAfter, collector, types);
                        }
                    }
                }
            });
            if (types['boolean']) {
                this.addBooleanValueCompletion(true, separatorAfter, collector);
                this.addBooleanValueCompletion(false, separatorAfter, collector);
            }
            if (types['null']) {
                this.addNullValueCompletion(separatorAfter, collector);
            }
        }
    }
    getCustomTagValueCompletions(collector) {
        const validCustomTags = arrUtils_1.filterInvalidCustomTags(this.customTags);
        validCustomTags.forEach((validTag) => {
            // Valid custom tags are guarenteed to be strings
            const label = validTag.split(' ')[0];
            this.addCustomTagValueCompletion(collector, ' ', label);
        });
    }
    addSchemaValueCompletions(schema, separatorAfter, collector, types) {
        super.addSchemaValueCompletions(schema, separatorAfter, collector, types);
    }
    addDefaultValueCompletions(schema, separatorAfter, collector, arrayDepth = 0) {
        let hasProposals = false;
        if (isDefined(schema.default)) {
            let type = schema.type;
            let value = schema.default;
            for (let i = arrayDepth; i > 0; i--) {
                value = [value];
                type = 'array';
            }
            let label;
            if (typeof value == 'object') {
                label = 'Default value';
            }
            else {
                label = value.toString().replace(doubleQuotesEscapeRegExp, '"');
            }
            collector.add({
                kind: this.getSuggestionKind(type),
                label,
                insertText: this.getInsertTextForValue(value, separatorAfter, type),
                insertTextFormat: vscode_languageserver_types_1.InsertTextFormat.Snippet,
                detail: localize('json.suggest.default', 'Default value'),
            });
            hasProposals = true;
        }
        if (Array.isArray(schema.examples)) {
            schema.examples.forEach((example) => {
                let type = schema.type;
                let value = example;
                for (let i = arrayDepth; i > 0; i--) {
                    value = [value];
                    type = 'array';
                }
                collector.add({
                    kind: this.getSuggestionKind(type),
                    label: this.getLabelForValue(value),
                    insertText: this.getInsertTextForValue(value, separatorAfter, type),
                    insertTextFormat: vscode_languageserver_types_1.InsertTextFormat.Snippet,
                });
                hasProposals = true;
            });
        }
        this.collectDefaultSnippets(schema, separatorAfter, collector, {
            newLineFirst: true,
            indentFirstObject: true,
            shouldIndentWithTab: true,
        });
        if (!hasProposals && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
            this.addDefaultValueCompletions(schema.items, separatorAfter, collector, arrayDepth + 1);
        }
    }
    collectDefaultSnippets(schema, separatorAfter, collector, settings, arrayDepth = 0) {
        if (Array.isArray(schema.defaultSnippets)) {
            schema.defaultSnippets.forEach((s) => {
                let type = schema.type;
                let value = s.body;
                let label = s.label;
                let insertText;
                let filterText;
                if (isDefined(value)) {
                    const type = s.type || schema.type;
                    if (arrayDepth === 0 && type === 'array') {
                        // We know that a - isn't present yet so we need to add one
                        const fixedObj = {};
                        Object.keys(value).forEach((val, index) => {
                            if (index === 0 && !val.startsWith('-')) {
                                fixedObj[`- ${val}`] = value[val];
                            }
                            else {
                                fixedObj[`  ${val}`] = value[val];
                            }
                        });
                        value = fixedObj;
                    }
                    insertText = this.getInsertTextForSnippetValue(value, separatorAfter, settings);
                    label = label || this.getLabelForSnippetValue(value);
                }
                else if (typeof s.bodyText === 'string') {
                    let prefix = '', suffix = '', indent = '';
                    for (let i = arrayDepth; i > 0; i--) {
                        prefix = prefix + indent + '[\n';
                        suffix = suffix + '\n' + indent + ']';
                        indent += this.indentation;
                        type = 'array';
                    }
                    insertText = prefix + indent + s.bodyText.split('\n').join('\n' + indent) + suffix + separatorAfter;
                    label = label || insertText;
                    filterText = insertText.replace(/[\n]/g, ''); // remove new lines
                }
                collector.add({
                    kind: s.suggestionKind || this.getSuggestionKind(type),
                    label,
                    documentation: super.fromMarkup(s.markdownDescription) || s.description,
                    insertText,
                    insertTextFormat: vscode_languageserver_types_1.InsertTextFormat.Snippet,
                    filterText,
                });
            });
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getInsertTextForSnippetValue(value, separatorAfter, settings, depth) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const replacer = (value) => {
            if (typeof value === 'string') {
                if (value[0] === '^') {
                    return value.substr(1);
                }
                if (value === 'true' || value === 'false') {
                    return `"${value}"`;
                }
            }
            return value;
        };
        return json_1.stringifyObject(value, '', replacer, settings, depth) + separatorAfter;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getLabelForSnippetValue(value) {
        const label = JSON.stringify(value);
        return label.replace(/\$\{\d+:([^}]+)\}|\$\d+/g, '$1');
    }
    addCustomTagValueCompletion(collector, separatorAfter, label) {
        collector.add({
            kind: super.getSuggestionKind('string'),
            label: label,
            insertText: label + separatorAfter,
            insertTextFormat: vscode_languageserver_types_1.InsertTextFormat.Snippet,
            documentation: '',
        });
    }
    addBooleanValueCompletion(value, separatorAfter, collector) {
        collector.add({
            kind: this.getSuggestionKind('boolean'),
            label: value ? 'true' : 'false',
            insertText: this.getInsertTextForValue(value, separatorAfter, 'boolean'),
            insertTextFormat: vscode_languageserver_types_1.InsertTextFormat.Snippet,
            documentation: '',
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getSuggestionKind(type) {
        if (Array.isArray(type)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const array = type;
            type = array.length > 0 ? array[0] : null;
        }
        if (!type) {
            return vscode_languageserver_types_1.CompletionItemKind.Value;
        }
        switch (type) {
            case 'string':
                return vscode_languageserver_types_1.CompletionItemKind.Value;
            case 'object':
                return vscode_languageserver_types_1.CompletionItemKind.Module;
            case 'property':
                return vscode_languageserver_types_1.CompletionItemKind.Property;
            default:
                return vscode_languageserver_types_1.CompletionItemKind.Value;
        }
    }
    addNullValueCompletion(separatorAfter, collector) {
        collector.add({
            kind: this.getSuggestionKind('null'),
            label: 'null',
            insertText: 'null' + separatorAfter,
            insertTextFormat: vscode_languageserver_types_1.InsertTextFormat.Snippet,
            documentation: '',
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getInsertTextForValue(value, separatorAfter, type) {
        if (value === null) {
            value = 'null'; // replace type null with string 'null'
        }
        switch (typeof value) {
            case 'object': {
                const indent = this.indentation;
                return this.getInsertTemplateForValue(value, indent, { index: 1 }, separatorAfter);
            }
        }
        type = Array.isArray(type) ? type[0] : type;
        if (type === 'string') {
            value = convertToStringValue(value);
        }
        return this.getInsertTextForPlainText(value + separatorAfter);
    }
    getInsertTemplateForValue(value, indent, navOrder, separatorAfter) {
        if (Array.isArray(value)) {
            let insertText = '\n';
            for (const arrValue of value) {
                insertText += `${indent}- \${${navOrder.index++}:${arrValue}}\n`;
            }
            return insertText;
        }
        else if (typeof value === 'object') {
            let insertText = '\n';
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    const element = value[key];
                    insertText += `${indent}\${${navOrder.index++}:${key}}:`;
                    let valueTemplate;
                    if (typeof element === 'object') {
                        valueTemplate = `${this.getInsertTemplateForValue(element, indent + this.indentation, navOrder, separatorAfter)}`;
                    }
                    else {
                        valueTemplate = ` \${${navOrder.index++}:${this.getInsertTextForPlainText(element + separatorAfter)}}\n`;
                    }
                    insertText += `${valueTemplate}`;
                }
            }
            return insertText;
        }
        return this.getInsertTextForPlainText(value + separatorAfter);
    }
    getInsertTextForPlainText(text) {
        return text.replace(/[\\$}]/g, '\\$&'); // escape $, \ and }
    }
    getInsertTextForObject(schema, separatorAfter, indent = this.indentation, insertIndex = 1) {
        let insertText = '';
        if (!schema.properties) {
            insertText = `${indent}$${insertIndex++}\n`;
            return { insertText, insertIndex };
        }
        const iterator = schema.propertyOrder !== undefined ? schema.propertyOrder : Object.keys(schema.properties);
        iterator.forEach((key) => {
            const propertySchema = schema.properties[key];
            let type = Array.isArray(propertySchema.type) ? propertySchema.type[0] : propertySchema.type;
            if (!type) {
                if (propertySchema.properties) {
                    type = 'object';
                }
                if (propertySchema.items) {
                    type = 'array';
                }
            }
            if (schema.required && schema.required.indexOf(key) > -1) {
                switch (type) {
                    case 'boolean':
                    case 'string':
                    case 'number':
                    case 'integer':
                        insertText += `${indent}${key}: $${insertIndex++}\n`;
                        break;
                    case 'array':
                        {
                            const arrayInsertResult = this.getInsertTextForArray(propertySchema.items, separatorAfter, insertIndex++);
                            const arrayInsertLines = arrayInsertResult.insertText.split('\n');
                            let arrayTemplate = arrayInsertResult.insertText;
                            if (arrayInsertLines.length > 1) {
                                for (let index = 1; index < arrayInsertLines.length; index++) {
                                    const element = arrayInsertLines[index];
                                    arrayInsertLines[index] = `${indent}${this.indentation}  ${element.trimLeft()}`;
                                }
                                arrayTemplate = arrayInsertLines.join('\n');
                            }
                            insertIndex = arrayInsertResult.insertIndex;
                            insertText += `${indent}${key}:\n${indent}${this.indentation}- ${arrayTemplate}\n`;
                        }
                        break;
                    case 'object':
                        {
                            const objectInsertResult = this.getInsertTextForObject(propertySchema, separatorAfter, `${indent}${this.indentation}`, insertIndex++);
                            insertIndex = objectInsertResult.insertIndex;
                            insertText += `${indent}${key}:\n${objectInsertResult.insertText}\n`;
                        }
                        break;
                }
            }
            else if (propertySchema.default !== undefined) {
                switch (type) {
                    case 'boolean':
                    case 'number':
                    case 'integer':
                        insertText += `${indent}${key}: \${${insertIndex++}:${propertySchema.default}}\n`;
                        break;
                    case 'string':
                        insertText += `${indent}${key}: \${${insertIndex++}:${convertToStringValue(propertySchema.default)}}\n`;
                        break;
                    case 'array':
                    case 'object':
                        // TODO: support default value for array object
                        break;
                }
            }
        });
        if (insertText.trim().length === 0) {
            insertText = `${indent}$${insertIndex++}\n`;
        }
        insertText = insertText.trimRight() + separatorAfter;
        return { insertText, insertIndex };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getInsertTextForArray(schema, separatorAfter, insertIndex = 1) {
        let insertText = '';
        if (!schema) {
            insertText = `$${insertIndex++}`;
            return { insertText, insertIndex };
        }
        let type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
        if (!type) {
            if (schema.properties) {
                type = 'object';
            }
            if (schema.items) {
                type = 'array';
            }
        }
        switch (schema.type) {
            case 'boolean':
                insertText = `\${${insertIndex++}:false}`;
                break;
            case 'number':
            case 'integer':
                insertText = `\${${insertIndex++}:0}`;
                break;
            case 'string':
                insertText = `\${${insertIndex++}:""}`;
                break;
            case 'object':
                {
                    const objectInsertResult = this.getInsertTextForObject(schema, separatorAfter, `${this.indentation}  `, insertIndex++);
                    insertText = objectInsertResult.insertText.trimLeft();
                    insertIndex = objectInsertResult.insertIndex;
                }
                break;
        }
        return { insertText, insertIndex };
    }
    getInsertTextForProperty(key, propertySchema, addValue, separatorAfter, ident = this.indentation) {
        const propertyText = this.getInsertTextForValue(key, '', 'string');
        const resultText = propertyText + ':';
        let value;
        let nValueProposals = 0;
        if (propertySchema) {
            let type = Array.isArray(propertySchema.type) ? propertySchema.type[0] : propertySchema.type;
            if (!type) {
                if (propertySchema.properties) {
                    type = 'object';
                }
                else if (propertySchema.items) {
                    type = 'array';
                }
            }
            if (Array.isArray(propertySchema.defaultSnippets)) {
                if (propertySchema.defaultSnippets.length === 1) {
                    const body = propertySchema.defaultSnippets[0].body;
                    if (isDefined(body)) {
                        value = this.getInsertTextForSnippetValue(body, '', {
                            newLineFirst: true,
                            indentFirstObject: false,
                            shouldIndentWithTab: false,
                        }, 1);
                        // add space before default snippet value
                        if (!value.startsWith(' ') && !value.startsWith('\n')) {
                            value = ' ' + value;
                        }
                    }
                }
                nValueProposals += propertySchema.defaultSnippets.length;
            }
            if (propertySchema.enum) {
                if (!value && propertySchema.enum.length === 1) {
                    value = ' ' + this.getInsertTextForGuessedValue(propertySchema.enum[0], '', type);
                }
                nValueProposals += propertySchema.enum.length;
            }
            if (isDefined(propertySchema.default)) {
                if (!value) {
                    value = ' ' + this.getInsertTextForGuessedValue(propertySchema.default, '', type);
                }
                nValueProposals++;
            }
            if (Array.isArray(propertySchema.examples) && propertySchema.examples.length) {
                if (!value) {
                    value = ' ' + this.getInsertTextForGuessedValue(propertySchema.examples[0], '', type);
                }
                nValueProposals += propertySchema.examples.length;
            }
            if (propertySchema.properties) {
                return `${resultText}\n${this.getInsertTextForObject(propertySchema, separatorAfter, ident).insertText}`;
            }
            else if (propertySchema.items) {
                return `${resultText}\n${this.indentation}- ${this.getInsertTextForArray(propertySchema.items, separatorAfter).insertText}`;
            }
            if (nValueProposals === 0) {
                switch (type) {
                    case 'boolean':
                        value = ' $1';
                        break;
                    case 'string':
                        value = ' $1';
                        break;
                    case 'object':
                        value = `\n${ident}`;
                        break;
                    case 'array':
                        value = `\n${ident}- `;
                        break;
                    case 'number':
                    case 'integer':
                        value = ' ${1:0}';
                        break;
                    case 'null':
                        value = ' ${1:null}';
                        break;
                    default:
                        return propertyText;
                }
            }
        }
        if (!value || nValueProposals > 1) {
            value = ' $1';
        }
        return resultText + value + separatorAfter;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getInsertTextForGuessedValue(value, separatorAfter, type) {
        switch (typeof value) {
            case 'object':
                if (value === null) {
                    return '${1:null}' + separatorAfter;
                }
                return this.getInsertTextForValue(value, separatorAfter, type);
            case 'string': {
                let snippetValue = JSON.stringify(value);
                snippetValue = snippetValue.substr(1, snippetValue.length - 2); // remove quotes
                snippetValue = this.getInsertTextForPlainText(snippetValue); // escape \ and }
                if (type === 'string') {
                    snippetValue = convertToStringValue(snippetValue);
                }
                return '${1:' + snippetValue + '}' + separatorAfter;
            }
            case 'number':
            case 'boolean':
                return '${1:' + value + '}' + separatorAfter;
        }
        return this.getInsertTextForValue(value, separatorAfter, type);
    }
    getLabelForValue(value) {
        if (value === null) {
            return 'null'; // return string with 'null' value if schema contains null as possible value
        }
        if (Array.isArray(value)) {
            return JSON.stringify(value);
        }
        return value;
    }
    /**
     * Corrects simple syntax mistakes to load possible nodes even if a semicolon is missing
     */
    completionHelper(document, textDocumentPosition) {
        // Get the string we are looking at via a substring
        const linePos = textDocumentPosition.line;
        const position = textDocumentPosition;
        const lineOffset = arrUtils_1.getLineOffsets(document.getText());
        const start = lineOffset[linePos]; // Start of where the autocompletion is happening
        let end = 0; // End of where the autocompletion is happening
        if (lineOffset[linePos + 1]) {
            end = lineOffset[linePos + 1];
        }
        else {
            end = document.getText().length;
        }
        while (end - 1 >= 0 && this.is_EOL(document.getText().charCodeAt(end - 1))) {
            end--;
        }
        const textLine = document.getText().substring(start, end);
        // Check if document contains only white spaces and line delimiters
        if (document.getText().trim().length === 0) {
            return {
                // add empty object to be compatible with JSON
                newText: `{${document.getText()}}\n`,
                newPosition: textDocumentPosition,
            };
        }
        // Check if the string we are looking at is a node
        if (textLine.indexOf(':') === -1) {
            // We need to add the ":" to load the nodes
            let newText = '';
            // This is for the empty line case
            const trimmedText = textLine.trim();
            if (trimmedText.length === 0 || (trimmedText.length === 1 && trimmedText[0] === '-')) {
                //same condition as (end < start) - protect of jumping back across lines, when 'holder' is put into incorrect place
                const spaceLength = textLine.includes(' ') ? textLine.length : 0;
                // Add a temp node that is in the document but we don't use at all.
                newText =
                    document.getText().substring(0, start + spaceLength) +
                        (trimmedText[0] === '-' && !textLine.endsWith(' ') ? ' ' : '') +
                        'holder:\r\n' +
                        document.getText().substr(lineOffset[linePos + 1] || document.getText().length);
                // For when missing semi colon case
            }
            else if (trimmedText.indexOf('[') === -1) {
                // Add a semicolon to the end of the current line so we can validate the node
                newText =
                    document.getText().substring(0, start + textLine.length) +
                        ':\r\n' +
                        document.getText().substr(lineOffset[linePos + 1] || document.getText().length);
            }
            if (newText.length === 0) {
                newText = document.getText();
            }
            return {
                newText: newText,
                newPosition: textDocumentPosition,
            };
        }
        else {
            // All the nodes are loaded
            position.character = position.character - 1;
            return {
                newText: document.getText(),
                newPosition: position,
            };
        }
    }
    is_EOL(c) {
        return c === 0x0a /* LF */ || c === 0x0d /* CR */;
    }
    getDocumentationWithMarkdownText(documentation, insertText) {
        let res = documentation;
        if (super.doesSupportMarkdown()) {
            insertText = insertText
                .replace(/\${[0-9]+[:|](.*)}/g, (s, arg) => {
                return arg;
            })
                .replace(/\$([0-9]+)/g, '');
            res = super.fromMarkup(`${documentation}\n \`\`\`\n${insertText}\n\`\`\``);
        }
        return res;
    }
}
exports.YAMLCompletion = YAMLCompletion;
const isNumberExp = /^\d+$/;
function convertToStringValue(value) {
    if (value === 'true' || value === 'false' || value === 'null' || isNumberExp.test(value)) {
        return `"${value}"`;
    }
    // eslint-disable-next-line prettier/prettier, no-useless-escape
    if (value.indexOf('\"') !== -1) {
        value = value.replace(doubleQuotesEscapeRegExp, '"');
    }
    if ((value.length > 0 && value.charAt(0) === '@') || value.includes(':')) {
        value = `"${value}"`;
    }
    return value;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
function isDefined(val) {
    return val !== undefined;
}
//# sourceMappingURL=yamlCompletion.js.map