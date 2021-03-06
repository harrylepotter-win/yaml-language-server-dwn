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
exports.YAMLSchemaService = exports.FilePatternAssociation = exports.MODIFICATION_ACTIONS = void 0;
const yamlLanguageService_1 = require("../yamlLanguageService");
const jsonSchemaService_1 = require("vscode-json-languageservice/lib/umd/services/jsonSchemaService");
const vscode_uri_1 = require("vscode-uri");
const nls = require("vscode-nls");
const strings_1 = require("../utils/strings");
const yamlParser07_1 = require("../parser/yamlParser07");
const js_yaml_1 = require("js-yaml");
const path = require("path");
const localize = nls.loadMessageBundle();
var MODIFICATION_ACTIONS;
(function (MODIFICATION_ACTIONS) {
    MODIFICATION_ACTIONS[MODIFICATION_ACTIONS["delete"] = 0] = "delete";
    MODIFICATION_ACTIONS[MODIFICATION_ACTIONS["add"] = 1] = "add";
    MODIFICATION_ACTIONS[MODIFICATION_ACTIONS["deleteAll"] = 2] = "deleteAll";
})(MODIFICATION_ACTIONS = exports.MODIFICATION_ACTIONS || (exports.MODIFICATION_ACTIONS = {}));
class FilePatternAssociation {
    constructor(pattern) {
        try {
            this.patternRegExp = new RegExp(strings_1.convertSimple2RegExpPattern(pattern) + '$');
        }
        catch (e) {
            // invalid pattern
            this.patternRegExp = null;
        }
        this.schemas = [];
    }
    addSchema(id) {
        this.schemas.push(id);
    }
    matchesPattern(fileName) {
        return this.patternRegExp && this.patternRegExp.test(fileName);
    }
    getSchemas() {
        return this.schemas;
    }
}
exports.FilePatternAssociation = FilePatternAssociation;
class YAMLSchemaService extends jsonSchemaService_1.JSONSchemaService {
    constructor(requestService, contextService, promiseConstructor) {
        super(requestService, contextService, promiseConstructor);
        this.customSchemaProvider = undefined;
        this.requestService = requestService;
        this.schemaPriorityMapping = new Map();
    }
    registerCustomSchemaProvider(customSchemaProvider) {
        this.customSchemaProvider = customSchemaProvider;
    }
    resolveSchemaContent(schemaToResolve, schemaURL, dependencies) {
        const resolveErrors = schemaToResolve.errors.slice(0);
        const schema = schemaToResolve.schema;
        const contextService = this.contextService;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const findSection = (schema, path) => {
            if (!path) {
                return schema;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let current = schema;
            if (path[0] === '/') {
                path = path.substr(1);
            }
            path.split('/').some((part) => {
                current = current[part];
                return !current;
            });
            return current;
        };
        const merge = (target, sourceRoot, sourceURI, path) => {
            const section = findSection(sourceRoot, path);
            if (section) {
                for (const key in section) {
                    if (Object.prototype.hasOwnProperty.call(section, key) && !Object.prototype.hasOwnProperty.call(target, key)) {
                        target[key] = section[key];
                    }
                }
            }
            else {
                resolveErrors.push(localize('json.schema.invalidref', "$ref '{0}' in '{1}' can not be resolved.", path, sourceURI));
            }
        };
        const resolveExternalLink = (node, uri, linkPath, parentSchemaURL, parentSchemaDependencies
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) => {
            if (contextService && !/^\w+:\/\/.*/.test(uri)) {
                uri = contextService.resolveRelativePath(uri, parentSchemaURL);
            }
            uri = this.normalizeId(uri);
            const referencedHandle = this.getOrAddSchemaHandle(uri);
            return referencedHandle.getUnresolvedSchema().then((unresolvedSchema) => {
                parentSchemaDependencies[uri] = true;
                if (unresolvedSchema.errors.length) {
                    const loc = linkPath ? uri + '#' + linkPath : uri;
                    resolveErrors.push(localize('json.schema.problemloadingref', "Problems loading reference '{0}': {1}", loc, unresolvedSchema.errors[0]));
                }
                merge(node, unresolvedSchema.schema, uri, linkPath);
                node.url = uri;
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                return resolveRefs(node, unresolvedSchema.schema, uri, referencedHandle.dependencies);
            });
        };
        const resolveRefs = (node, parentSchema, parentSchemaURL, parentSchemaDependencies
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) => {
            if (!node || typeof node !== 'object') {
                return Promise.resolve(null);
            }
            const toWalk = [node];
            const seen = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const openPromises = [];
            const collectEntries = (...entries) => {
                for (const entry of entries) {
                    if (typeof entry === 'object') {
                        toWalk.push(entry);
                    }
                }
            };
            const collectMapEntries = (...maps) => {
                for (const map of maps) {
                    if (typeof map === 'object') {
                        for (const key in map) {
                            const entry = map[key];
                            if (typeof entry === 'object') {
                                toWalk.push(entry);
                            }
                        }
                    }
                }
            };
            const collectArrayEntries = (...arrays) => {
                for (const array of arrays) {
                    if (Array.isArray(array)) {
                        for (const entry of array) {
                            if (typeof entry === 'object') {
                                toWalk.push(entry);
                            }
                        }
                    }
                }
            };
            const handleRef = (next) => {
                const seenRefs = [];
                while (next.$ref) {
                    const ref = next.$ref;
                    const segments = ref.split('#', 2);
                    //return back removed $ref. We lost info about referenced type without it.
                    next._$ref = next.$ref;
                    delete next.$ref;
                    if (segments[0].length > 0) {
                        openPromises.push(resolveExternalLink(next, segments[0], segments[1], parentSchemaURL, parentSchemaDependencies));
                        return;
                    }
                    else {
                        if (seenRefs.indexOf(ref) === -1) {
                            merge(next, parentSchema, parentSchemaURL, segments[1]); // can set next.$ref again, use seenRefs to avoid circle
                            seenRefs.push(ref);
                        }
                    }
                }
                collectEntries(next.items, next.additionalItems, next.additionalProperties, next.not, next.contains, next.propertyNames, next.if, next.then, next.else);
                collectMapEntries(next.definitions, next.properties, next.patternProperties, next.dependencies);
                collectArrayEntries(next.anyOf, next.allOf, next.oneOf, next.items, next.schemaSequence);
            };
            if (parentSchemaURL.indexOf('#') > 0) {
                const segments = parentSchemaURL.split('#', 2);
                if (segments[0].length > 0 && segments[1].length > 0) {
                    openPromises.push(resolveExternalLink(node, segments[0], segments[1], parentSchemaURL, parentSchemaDependencies));
                }
            }
            while (toWalk.length) {
                const next = toWalk.pop();
                if (seen.indexOf(next) >= 0) {
                    continue;
                }
                seen.push(next);
                handleRef(next);
            }
            return Promise.all(openPromises);
        };
        return resolveRefs(schema, schema, schemaURL, dependencies).then(() => {
            return new jsonSchemaService_1.ResolvedSchema(schema, resolveErrors);
        });
    }
    getSchemaForResource(resource, doc) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resolveSchema = () => {
            const seen = Object.create(null);
            const schemas = [];
            let schemaFromModeline = this.getSchemaFromModeline(doc);
            if (schemaFromModeline !== undefined) {
                if (!schemaFromModeline.startsWith('file:') && !schemaFromModeline.startsWith('http')) {
                    if (!path.isAbsolute(schemaFromModeline)) {
                        const resUri = vscode_uri_1.URI.parse(resource);
                        schemaFromModeline = vscode_uri_1.URI.file(path.resolve(path.parse(resUri.fsPath).dir, schemaFromModeline)).toString();
                    }
                    else {
                        schemaFromModeline = vscode_uri_1.URI.file(schemaFromModeline).toString();
                    }
                }
                this.addSchemaPriority(schemaFromModeline, yamlLanguageService_1.SchemaPriority.Modeline);
                schemas.push(schemaFromModeline);
                seen[schemaFromModeline] = true;
            }
            for (const entry of this.filePatternAssociations) {
                if (entry.matchesPattern(resource)) {
                    for (const schemaId of entry.getURIs()) {
                        if (!seen[schemaId]) {
                            schemas.push(schemaId);
                            seen[schemaId] = true;
                        }
                    }
                }
            }
            /**
             * If this resource matches a schemaID directly then use that schema.
             * This will be used in the case where the yaml language server is being used as a library
             * and clients want to save a schema with a particular ID and also use that schema
             * in language features
             */
            const normalizedResourceID = this.normalizeId(resource);
            if (this.schemasById[normalizedResourceID]) {
                schemas.push(normalizedResourceID);
            }
            if (schemas.length > 0) {
                // Join all schemas with the highest priority.
                const highestPrioSchemas = this.highestPrioritySchemas(schemas);
                const schemaHandle = super.createCombinedSchema(resource, highestPrioSchemas);
                return schemaHandle.getResolvedSchema().then((schema) => {
                    if (schema.schema && typeof schema.schema !== 'string') {
                        schema.schema.url = schemaHandle.url;
                    }
                    if (schema.schema &&
                        schema.schema.schemaSequence &&
                        schema.schema.schemaSequence[doc.currentDocIndex]) {
                        return new jsonSchemaService_1.ResolvedSchema(schema.schema.schemaSequence[doc.currentDocIndex]);
                    }
                    return schema;
                });
            }
            return Promise.resolve(null);
        };
        if (this.customSchemaProvider) {
            return this.customSchemaProvider(resource)
                .then((schemaUri) => {
                if (Array.isArray(schemaUri)) {
                    if (schemaUri.length === 0) {
                        return resolveSchema();
                    }
                    return Promise.all(schemaUri.map((schemaUri) => {
                        return this.resolveCustomSchema(schemaUri, doc);
                    })).then((schemas) => {
                        return {
                            errors: [],
                            schema: {
                                anyOf: schemas.map((schemaObj) => {
                                    return schemaObj.schema;
                                }),
                            },
                        };
                    }, () => {
                        return resolveSchema();
                    });
                }
                if (!schemaUri) {
                    return resolveSchema();
                }
                return this.resolveCustomSchema(schemaUri, doc);
            })
                .then((schema) => {
                return schema;
            }, () => {
                return resolveSchema();
            });
        }
        else {
            return resolveSchema();
        }
    }
    // Set the priority of a schema in the schema service
    addSchemaPriority(uri, priority) {
        let currSchemaArray = this.schemaPriorityMapping.get(uri);
        if (currSchemaArray) {
            currSchemaArray = currSchemaArray.add(priority);
            this.schemaPriorityMapping.set(uri, currSchemaArray);
        }
        else {
            this.schemaPriorityMapping.set(uri, new Set().add(priority));
        }
    }
    /**
     * Search through all the schemas and find the ones with the highest priority
     */
    highestPrioritySchemas(schemas) {
        let highestPrio = 0;
        const priorityMapping = new Map();
        schemas.forEach((schema) => {
            // If the schema does not have a priority then give it a default one of [0]
            const priority = this.schemaPriorityMapping.get(schema) || [0];
            priority.forEach((prio) => {
                if (prio > highestPrio) {
                    highestPrio = prio;
                }
                // Build up a mapping of priority to schemas so that we can easily get the highest priority schemas easier
                let currPriorityArray = priorityMapping.get(prio);
                if (currPriorityArray) {
                    currPriorityArray = currPriorityArray.concat(schema);
                    priorityMapping.set(prio, currPriorityArray);
                }
                else {
                    priorityMapping.set(prio, [schema]);
                }
            });
        });
        return priorityMapping.get(highestPrio) || [];
    }
    /**
     * Retrieve schema if declared as modeline.
     * Public for testing purpose, not part of the API.
     * @param doc
     */
    getSchemaFromModeline(doc) {
        if (doc instanceof yamlParser07_1.SingleYAMLDocument) {
            const yamlLanguageServerModeline = doc.lineComments.find((lineComment) => {
                const matchModeline = lineComment.match(/^#\s+yaml-language-server\s*:/g);
                return matchModeline !== null && matchModeline.length === 1;
            });
            if (yamlLanguageServerModeline != undefined) {
                const schemaMatchs = yamlLanguageServerModeline.match(/\$schema=\S+/g);
                if (schemaMatchs !== null && schemaMatchs.length >= 1) {
                    if (schemaMatchs.length >= 2) {
                        console.log('Several $schema attributes have been found on the yaml-language-server modeline. The first one will be picked.');
                    }
                    return schemaMatchs[0].substring('$schema='.length);
                }
            }
        }
        return undefined;
    }
    resolveCustomSchema(schemaUri, doc) {
        return __awaiter(this, void 0, void 0, function* () {
            const unresolvedSchema = yield this.loadSchema(schemaUri);
            const schema = yield this.resolveSchemaContent(unresolvedSchema, schemaUri, []);
            if (schema.schema) {
                schema.schema.url = schemaUri;
            }
            if (schema.schema && schema.schema.schemaSequence && schema.schema.schemaSequence[doc.currentDocIndex]) {
                return new jsonSchemaService_1.ResolvedSchema(schema.schema.schemaSequence[doc.currentDocIndex]);
            }
            return schema;
        });
    }
    /**
     * Save a schema with schema ID and schema content.
     * Overrides previous schemas set for that schema ID.
     */
    saveSchema(schemaId, schemaContent) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = this.normalizeId(schemaId);
            this.getOrAddSchemaHandle(id, schemaContent);
            this.schemaPriorityMapping.set(id, new Set().add(yamlLanguageService_1.SchemaPriority.Settings));
            return Promise.resolve(undefined);
        });
    }
    /**
     * Delete schemas on specific path
     */
    deleteSchemas(deletions) {
        return __awaiter(this, void 0, void 0, function* () {
            deletions.schemas.forEach((s) => {
                this.deleteSchema(s);
            });
            return Promise.resolve(undefined);
        });
    }
    /**
     * Delete a schema with schema ID.
     */
    deleteSchema(schemaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = this.normalizeId(schemaId);
            if (this.schemasById[id]) {
                delete this.schemasById[id];
            }
            this.schemaPriorityMapping.delete(id);
            return Promise.resolve(undefined);
        });
    }
    /**
     * Add content to a specified schema at a specified path
     */
    addContent(additions) {
        return __awaiter(this, void 0, void 0, function* () {
            const schema = yield this.getResolvedSchema(additions.schema);
            if (schema) {
                const resolvedSchemaLocation = this.resolveJSONSchemaToSection(schema.schema, additions.path);
                if (typeof resolvedSchemaLocation === 'object') {
                    resolvedSchemaLocation[additions.key] = additions.content;
                }
                yield this.saveSchema(additions.schema, schema.schema);
            }
        });
    }
    /**
     * Delete content in a specified schema at a specified path
     */
    deleteContent(deletions) {
        return __awaiter(this, void 0, void 0, function* () {
            const schema = yield this.getResolvedSchema(deletions.schema);
            if (schema) {
                const resolvedSchemaLocation = this.resolveJSONSchemaToSection(schema.schema, deletions.path);
                if (typeof resolvedSchemaLocation === 'object') {
                    delete resolvedSchemaLocation[deletions.key];
                }
                yield this.saveSchema(deletions.schema, schema.schema);
            }
        });
    }
    /**
     * Take a JSON Schema and the path that you would like to get to
     * @returns the JSON Schema resolved at that specific path
     */
    resolveJSONSchemaToSection(schema, paths) {
        const splitPathway = paths.split('/');
        let resolvedSchemaLocation = schema;
        for (const path of splitPathway) {
            if (path === '') {
                continue;
            }
            this.resolveNext(resolvedSchemaLocation, path);
            resolvedSchemaLocation = resolvedSchemaLocation[path];
        }
        return resolvedSchemaLocation;
    }
    /**
     * Resolve the next Object if they have compatible types
     * @param object a location in the JSON Schema
     * @param token the next token that you want to search for
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolveNext(object, token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (Array.isArray(object) && isNaN(token)) {
            throw new Error('Expected a number after the array object');
        }
        else if (typeof object === 'object' && typeof token !== 'string') {
            throw new Error('Expected a string after the object');
        }
    }
    /**
     * Everything below here is needed because we're importing from vscode-json-languageservice umd and we need
     * to provide a wrapper around the javascript methods we are calling since they have no type
     */
    normalizeId(id) {
        // The parent's `super.normalizeId(id)` isn't visible, so duplicated the code here
        try {
            return vscode_uri_1.URI.parse(id).toString();
        }
        catch (e) {
            return id;
        }
    }
    /*
     * Everything below here is needed because we're importing from vscode-json-languageservice umd and we need
     * to provide a wrapper around the javascript methods we are calling since they have no type
     */
    getOrAddSchemaHandle(id, unresolvedSchemaContent) {
        return super.getOrAddSchemaHandle(id, unresolvedSchemaContent);
    }
    loadSchema(schemaUri) {
        const requestService = this.requestService;
        return super.loadSchema(schemaUri).then((unresolvedJsonSchema) => {
            // If json-language-server failed to parse the schema, attempt to parse it as YAML instead.
            if (unresolvedJsonSchema.errors && unresolvedJsonSchema.schema === undefined) {
                return requestService(schemaUri).then((content) => {
                    if (!content) {
                        const errorMessage = localize('json.schema.nocontent', "Unable to load schema from '{0}': No content.", toDisplayString(schemaUri));
                        return new jsonSchemaService_1.UnresolvedSchema({}, [errorMessage]);
                    }
                    try {
                        const schemaContent = js_yaml_1.load(content);
                        return new jsonSchemaService_1.UnresolvedSchema(schemaContent, []);
                    }
                    catch (yamlError) {
                        const errorMessage = localize('json.schema.invalidFormat', "Unable to parse content from '{0}': {1}.", toDisplayString(schemaUri), yamlError);
                        return new jsonSchemaService_1.UnresolvedSchema({}, [errorMessage]);
                    }
                }, 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (error) => {
                    let errorMessage = error.toString();
                    const errorSplit = error.toString().split('Error: ');
                    if (errorSplit.length > 1) {
                        // more concise error message, URL and context are attached by caller anyways
                        errorMessage = errorSplit[1];
                    }
                    return new jsonSchemaService_1.UnresolvedSchema({}, [errorMessage]);
                });
            }
            unresolvedJsonSchema.uri = schemaUri;
            return unresolvedJsonSchema;
        });
    }
    registerExternalSchema(uri, filePatterns, unresolvedSchema) {
        return super.registerExternalSchema(uri, filePatterns, unresolvedSchema);
    }
    clearExternalSchemas() {
        super.clearExternalSchemas();
    }
    setSchemaContributions(schemaContributions) {
        super.setSchemaContributions(schemaContributions);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getRegisteredSchemaIds(filter) {
        return super.getRegisteredSchemaIds(filter);
    }
    getResolvedSchema(schemaId) {
        return super.getResolvedSchema(schemaId);
    }
    onResourceChange(uri) {
        return super.onResourceChange(uri);
    }
}
exports.YAMLSchemaService = YAMLSchemaService;
function toDisplayString(url) {
    try {
        const uri = vscode_uri_1.URI.parse(url);
        if (uri.scheme === 'file') {
            return uri.fsPath;
        }
    }
    catch (e) {
        // ignore
    }
    return url;
}
//# sourceMappingURL=yamlSchemaService.js.map