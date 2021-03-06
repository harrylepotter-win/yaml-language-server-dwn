"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
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
/* eslint-disable @typescript-eslint/no-var-requires */
const testHelper_1 = require("./utils/testHelper");
const assert = require("assert");
const path = require("path");
const verifyError_1 = require("./utils/verifyError");
const serviceSetup_1 = require("./utils/serviceSetup");
const vscode_languageserver_1 = require("vscode-languageserver");
const chai_1 = require("chai");
const yamlSettings_1 = require("../src/yamlSettings");
describe('Auto Completion Tests', () => {
    let languageSettingsSetup;
    let languageService;
    let languageHandler;
    let yamlSettings;
    before(() => {
        languageSettingsSetup = new serviceSetup_1.ServiceSetup().withCompletion().withSchemaFileMatch({
            uri: 'http://google.com',
            fileMatch: ['bad-schema.yaml'],
        });
        const { languageService: langService, languageHandler: langHandler, yamlSettings: settings } = testHelper_1.setupLanguageService(languageSettingsSetup.languageSettings);
        languageService = langService;
        languageHandler = langHandler;
        yamlSettings = settings;
    });
    function parseSetup(content, position) {
        const testTextDocument = testHelper_1.setupSchemaIDTextDocument(content);
        yamlSettings.documents = new yamlSettings_1.TextDocumentTestManager();
        yamlSettings.documents.set(testTextDocument);
        return languageHandler.completionHandler({
            position: testTextDocument.positionAt(position),
            textDocument: testTextDocument,
        });
    }
    afterEach(() => {
        languageService.deleteSchema(testHelper_1.SCHEMA_ID);
        languageService.configure(languageSettingsSetup.languageSettings);
    });
    describe('YAML Completion Tests', function () {
        describe('JSON Schema Tests', function () {
            it('Autocomplete on root without word', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                        },
                    },
                });
                const content = '';
                const completion = parseSetup(content, 0);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('name', 'name: $1', 0, 0, 0, 0, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Autocomplete on root with partial word', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                        },
                    },
                });
                const content = 'na';
                const completion = parseSetup(content, 2);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('name', 'name: $1', 0, 0, 0, 2, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Autocomplete on default value (without :)', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            default: 'yaml',
                        },
                    },
                });
                const content = 'name';
                const completion = parseSetup(content, 10);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('name', 'name: ${1:yaml}', 0, 0, 0, 4, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Autocomplete on default value (without value content)', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            default: 'yaml',
                        },
                    },
                });
                const content = 'name: ';
                const completion = parseSetup(content, 12);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('yaml', 'yaml', 0, 6, 0, 6, 12, 2, {
                        detail: 'Default value',
                    }));
                })
                    .then(done, done);
            });
            it('Autocomplete on default value with \\"', () => __awaiter(this, void 0, void 0, function* () {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            // eslint-disable-next-line prettier/prettier, no-useless-escape
                            default: '\"yaml\"',
                        },
                    },
                });
                const content = 'name: ';
                const completion = yield parseSetup(content, 6);
                assert.strictEqual(completion.items.length, 1);
                assert.deepStrictEqual(completion.items[0], verifyError_1.createExpectedCompletion('"yaml"', '"yaml"', 0, 6, 0, 6, 12, 2, {
                    detail: 'Default value',
                }));
            }));
            it('Autocomplete name and value with \\"', () => __awaiter(this, void 0, void 0, function* () {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            // eslint-disable-next-line prettier/prettier, no-useless-escape
                            default: '\"yaml\"',
                        },
                    },
                });
                const content = 'name';
                const completion = yield parseSetup(content, 3);
                assert.strictEqual(completion.items.length, 1);
                assert.deepStrictEqual(completion.items[0], verifyError_1.createExpectedCompletion('name', 'name: ${1:"yaml"}', 0, 0, 0, 4, 10, 2, {
                    documentation: '',
                }));
            }));
            it('Autocomplete on default value (with value content)', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            default: 'yaml',
                        },
                    },
                });
                const content = 'name: ya';
                const completion = parseSetup(content, 15);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('yaml', 'yaml', 0, 6, 0, 8, 12, 2, {
                        detail: 'Default value',
                    }));
                })
                    .then(done, done);
            });
            it('Autocomplete on boolean value (without value content)', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        yaml: {
                            type: 'boolean',
                        },
                    },
                });
                const content = 'yaml: ';
                const completion = parseSetup(content, 11);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 2);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('true', 'true', 0, 6, 0, 6, 12, 2, {
                        documentation: '',
                    }));
                    assert.deepEqual(result.items[1], verifyError_1.createExpectedCompletion('false', 'false', 0, 6, 0, 6, 12, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Autocomplete on boolean value (with value content)', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        yaml: {
                            type: 'boolean',
                        },
                    },
                });
                const content = 'yaml: fal';
                const completion = parseSetup(content, 11);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 2);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('true', 'true', 0, 6, 0, 9, 12, 2, {
                        documentation: '',
                    }));
                    assert.deepEqual(result.items[1], verifyError_1.createExpectedCompletion('false', 'false', 0, 6, 0, 9, 12, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Autocomplete on number value (without value content)', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        timeout: {
                            type: 'number',
                            default: 60000,
                        },
                    },
                });
                const content = 'timeout: ';
                const completion = parseSetup(content, 9);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('60000', '60000', 0, 9, 0, 9, 12, 2, {
                        detail: 'Default value',
                    }));
                })
                    .then(done, done);
            });
            it('Autocomplete on number value (with value content)', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        timeout: {
                            type: 'number',
                            default: 60000,
                        },
                    },
                });
                const content = 'timeout: 6';
                const completion = parseSetup(content, 10);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('60000', '60000', 0, 9, 0, 10, 12, 2, {
                        detail: 'Default value',
                    }));
                })
                    .then(done, done);
            });
            it('Autocomplete key in middle of file', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        scripts: {
                            type: 'object',
                            properties: {
                                sample: {
                                    type: 'string',
                                    enum: ['test'],
                                },
                            },
                        },
                    },
                });
                const content = 'scripts:\n  sample';
                const completion = parseSetup(content, 11);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('sample', 'sample: ${1:test}', 1, 2, 1, 8, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Autocomplete key with default value in middle of file', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        scripts: {
                            type: 'object',
                            properties: {
                                sample: {
                                    type: 'string',
                                    default: 'test',
                                },
                            },
                        },
                    },
                });
                const content = 'scripts:\n  sam';
                const completion = parseSetup(content, 11);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('sample', 'sample: ${1:test}', 1, 2, 1, 5, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Autocomplete second key in middle of file', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        scripts: {
                            type: 'object',
                            properties: {
                                sample: {
                                    type: 'string',
                                    enum: ['test'],
                                },
                                myOtherSample: {
                                    type: 'string',
                                    enum: ['test'],
                                },
                            },
                        },
                    },
                });
                const content = 'scripts:\n  sample: test\n  myOther';
                const completion = parseSetup(content, 31);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('myOtherSample', 'myOtherSample: ${1:test}', 2, 2, 2, 9, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Autocomplete does not happen right after key object', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        timeout: {
                            type: 'number',
                            default: 60000,
                        },
                    },
                });
                const content = 'timeout:';
                const completion = parseSetup(content, 9);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 0);
                })
                    .then(done, done);
            });
            it('Autocomplete does not happen right after : under an object', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        scripts: {
                            type: 'object',
                            properties: {
                                sample: {
                                    type: 'string',
                                    enum: ['test'],
                                },
                                myOtherSample: {
                                    type: 'string',
                                    enum: ['test'],
                                },
                            },
                        },
                    },
                });
                const content = 'scripts:\n  sample:';
                const completion = parseSetup(content, 21);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 0);
                })
                    .then(done, done);
            });
            it('Autocomplete with defaultSnippet markdown', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        scripts: {
                            type: 'object',
                            properties: {},
                            defaultSnippets: [
                                {
                                    label: 'myOtherSample snippet',
                                    body: { myOtherSample: {} },
                                    markdownDescription: 'snippet\n```yaml\nmyOtherSample:\n```\n',
                                },
                            ],
                        },
                    },
                });
                const content = 'scripts: ';
                const completion = parseSetup(content, content.length);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.equal(result.items[0].insertText, '\n  myOtherSample: ');
                    assert.equal(result.items[0].documentation.value, 'snippet\n```yaml\nmyOtherSample:\n```\n');
                })
                    .then(done, done);
            });
            it('Autocomplete on multi yaml documents in a single file on root', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        timeout: {
                            type: 'number',
                            default: 60000,
                        },
                    },
                });
                const content = '---\ntimeout: 10\n...\n---\n...';
                const completion = parseSetup(content, 28);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('timeout', 'timeout: ${1:60000}', 4, 0, 4, 3, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Autocomplete on multi yaml documents in a single file on scalar', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        timeout: {
                            type: 'number',
                            default: 60000,
                        },
                    },
                });
                const content = '---\ntimeout: 10\n...\n---\ntime \n...';
                const completion = parseSetup(content, 26);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('timeout', 'timeout: ${1:60000}', 4, 0, 4, 4, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Autocompletion has no results on value when they are not available', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        time: {
                            type: 'string',
                        },
                    },
                });
                const content = 'time: ';
                const completion = parseSetup(content, 6);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 0);
                })
                    .then(done, done);
            });
            it('Test that properties that have multiple enums get auto completed properly', (done) => {
                const schema = {
                    definitions: {
                        ImageBuild: {
                            type: 'object',
                            properties: {
                                kind: {
                                    type: 'string',
                                    enum: ['ImageBuild', 'ImageBuilder'],
                                },
                            },
                        },
                        ImageStream: {
                            type: 'object',
                            properties: {
                                kind: {
                                    type: 'string',
                                    enum: ['ImageStream', 'ImageStreamBuilder'],
                                },
                            },
                        },
                    },
                    oneOf: [
                        {
                            $ref: '#/definitions/ImageBuild',
                        },
                        {
                            $ref: '#/definitions/ImageStream',
                        },
                    ],
                };
                languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
                const content = 'kind: ';
                const validator = parseSetup(content, 6);
                validator
                    .then(function (result) {
                    assert.equal(result.items.length, 4);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('ImageBuild', 'ImageBuild', 0, 6, 0, 6, 12, 2, {
                        documentation: undefined,
                    }));
                    assert.deepEqual(result.items[1], verifyError_1.createExpectedCompletion('ImageBuilder', 'ImageBuilder', 0, 6, 0, 6, 12, 2, {
                        documentation: undefined,
                    }));
                    assert.deepEqual(result.items[2], verifyError_1.createExpectedCompletion('ImageStream', 'ImageStream', 0, 6, 0, 6, 12, 2, {
                        documentation: undefined,
                    }));
                    assert.deepEqual(result.items[3], verifyError_1.createExpectedCompletion('ImageStreamBuilder', 'ImageStreamBuilder', 0, 6, 0, 6, 12, 2, {
                        documentation: undefined,
                    }));
                })
                    .then(done, done);
            });
            it('Insert required attributes at correct level', (done) => {
                const schema = require(path.join(__dirname, './fixtures/testRequiredProperties.json'));
                languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
                const content = '- top:\n    prop1: demo\n- ';
                const completion = parseSetup(content, content.length);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('top', 'top:\n      prop1: $1', 2, 2, 2, 2, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Insert required attributes at correct level even on first element', (done) => {
                const schema = require(path.join(__dirname, './fixtures/testRequiredProperties.json'));
                languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
                const content = '- ';
                const completion = parseSetup(content, content.length);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('top', 'top:\n    prop1: $1', 0, 2, 0, 2, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Provide the 3 types when none provided', (done) => {
                const schema = require(path.join(__dirname, './fixtures/testArrayMaxProperties.json'));
                languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
                const content = '- ';
                const completion = parseSetup(content, content.length);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 3);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('prop1', 'prop1: $1', 0, 2, 0, 2, 10, 2, {
                        documentation: '',
                    }));
                    assert.deepEqual(result.items[1], verifyError_1.createExpectedCompletion('prop2', 'prop2: $1', 0, 2, 0, 2, 10, 2, {
                        documentation: '',
                    }));
                    assert.deepEqual(result.items[2], verifyError_1.createExpectedCompletion('prop3', 'prop3: $1', 0, 2, 0, 2, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Provide the 3 types when one is provided', (done) => {
                const schema = require(path.join(__dirname, './fixtures/testArrayMaxProperties.json'));
                languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
                const content = '- prop1:\n  ';
                const completion = parseSetup(content, content.length);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 2);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('prop2', 'prop2: $1', 1, 2, 1, 2, 10, 2, {
                        documentation: '',
                    }));
                    assert.deepEqual(result.items[1], verifyError_1.createExpectedCompletion('prop3', 'prop3: $1', 1, 2, 1, 2, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Provide no completion when maxProperties reached', (done) => {
                const schema = require(path.join(__dirname, './fixtures/testArrayMaxProperties.json'));
                languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
                const content = '- prop1:\n  prop2:\n  ';
                const completion = parseSetup(content, content.length);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 0);
                })
                    .then(done, done);
            });
            it('Autocompletion should escape @', () => __awaiter(this, void 0, void 0, function* () {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        '@type': {
                            type: 'string',
                            enum: ['foo'],
                        },
                    },
                });
                const content = '';
                const completion = yield parseSetup(content, 0);
                chai_1.expect(completion.items.length).to.be.equal(1);
                chai_1.expect(completion.items[0]).to.deep.equal(verifyError_1.createExpectedCompletion('@type', '"@type": ${1:foo}', 0, 0, 0, 0, 10, 2, {
                    documentation: '',
                }));
            }));
            it('Autocompletion should escape colon', () => __awaiter(this, void 0, void 0, function* () {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        'test: colon': {
                            type: 'object',
                            properties: {
                                none: {
                                    type: 'boolean',
                                    enum: [true],
                                },
                            },
                        },
                    },
                });
                const content = '';
                const completion = yield parseSetup(content, 0);
                chai_1.expect(completion.items.length).to.be.equal(1);
                chai_1.expect(completion.items[0]).to.deep.equal(verifyError_1.createExpectedCompletion('test: colon', '"test: colon":\n  $1', 0, 0, 0, 0, 10, 2, {
                    documentation: '',
                }));
            }));
        });
        describe('Array Specific Tests', function () {
            it('Should insert empty array item', (done) => {
                const schema = require(path.join(__dirname, './fixtures/testStringArray.json'));
                languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
                const content = 'fooBa';
                const completion = parseSetup(content, content.lastIndexOf('Ba') + 2);
                completion
                    .then(function (result) {
                    assert.strictEqual('fooBar:\n  - ${1:""}', result.items[0].insertText);
                })
                    .then(done, done);
            });
            it('Array autocomplete without word and extra space', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        authors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                });
                const content = 'authors:\n  - ';
                const completion = parseSetup(content, 14);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('name', 'name: $1', 1, 4, 1, 4, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Array autocomplete without word and autocompletion beside -', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        authors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                });
                const content = 'authors:\n  -';
                const completion = parseSetup(content, 13);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('- (array item)', '- $1', 1, 2, 1, 3, 9, 2, {
                        documentation: 'Create an item of an array',
                    }));
                })
                    .then(done, done);
            });
            it('Array autocomplete without word on space before array symbol', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        authors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                    },
                                    email: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                });
                const content = 'authors:\n  - name: test\n  ';
                const completion = parseSetup(content, 24);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('- (array item)', '- $1', 2, 0, 2, 0, 9, 2, {
                        documentation: 'Create an item of an array',
                    }));
                })
                    .then(done, done);
            });
            it('Array autocomplete with letter', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        authors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                });
                const content = 'authors:\n  - n';
                const completion = parseSetup(content, 14);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('name', 'name: $1', 1, 4, 1, 5, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Array autocomplete without word (second item)', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        authors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                    },
                                    email: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                });
                const content = 'authors:\n  - name: test\n    ';
                const completion = parseSetup(content, 32);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('email', 'email: $1', 2, 4, 2, 4, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Array autocomplete with letter (second item)', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        authors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                    },
                                    email: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                    },
                });
                const content = 'authors:\n  - name: test\n    e';
                const completion = parseSetup(content, 27);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('email', 'email: $1', 2, 3, 2, 3, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Autocompletion after array', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        authors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                    },
                                    email: {
                                        type: 'string',
                                    },
                                },
                            },
                        },
                        load: {
                            type: 'boolean',
                        },
                    },
                });
                const content = 'authors:\n  - name: test\n';
                const completion = parseSetup(content, 24);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('load', 'load: $1', 2, 0, 2, 0, 10, 2, {
                        documentation: '',
                    }));
                })
                    .then(done, done);
            });
            it('Autocompletion after array with depth - no indent', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        archive: {
                            type: 'object',
                            properties: {
                                exclude: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            name: {
                                                type: 'string',
                                                default: 'test',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        include: {
                            type: 'string',
                            default: 'test',
                        },
                    },
                });
                const content = 'archive:\n  exclude:\n    - name: test\n\n';
                const completion = parseSetup(content, content.length - 1); //don't test on the last row
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    const expectedCompletion = verifyError_1.createExpectedCompletion('include', 'include: ${1:test}', 3, 0, 3, 0, 10, 2, {
                        documentation: '',
                    });
                    delete expectedCompletion.textEdit;
                    assert.deepEqual(result.items[0], expectedCompletion);
                })
                    .then(done, done);
            });
            it('Autocompletion after array with depth - indent', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        archive: {
                            type: 'object',
                            properties: {
                                exclude: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            name: {
                                                type: 'string',
                                                default: 'test',
                                            },
                                        },
                                    },
                                },
                                include: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                });
                const content = 'archive:\n  exclude:\n    - nam\n  ';
                const completion = parseSetup(content, content.length - 1);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('- (array item)', '- name: ${1:test}', 3, 1, 3, 1, 9, 2, {
                        documentation: 'Create an item of an array',
                    }));
                })
                    .then(done, done);
            });
            it('Array of enum autocomplete without word on array symbol', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        references: {
                            type: 'array',
                            items: {
                                enum: ['Test'],
                            },
                        },
                    },
                });
                const content = 'references:\n  -';
                const completion = parseSetup(content, 29);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('Test', 'Test', 1, 2, 1, 3, 12, 2, {
                        documentation: undefined,
                    }));
                })
                    .then(done, done);
            });
            it('Array of enum autocomplete without word', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        references: {
                            type: 'array',
                            items: {
                                enum: ['Test'],
                            },
                        },
                    },
                });
                const content = 'references:\n  - ';
                const completion = parseSetup(content, 30);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('Test', 'Test', 1, 4, 1, 4, 12, 2, {
                        documentation: undefined,
                    }));
                })
                    .then(done, done);
            });
            it('Array of enum autocomplete with letter', (done) => {
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        references: {
                            type: 'array',
                            items: {
                                enum: ['Test'],
                            },
                        },
                    },
                });
                const content = 'references:\n  - T';
                const completion = parseSetup(content, 31);
                completion
                    .then(function (result) {
                    assert.equal(result.items.length, 1);
                    assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('Test', 'Test', 1, 4, 1, 5, 12, 2, {
                        documentation: undefined,
                    }));
                })
                    .then(done, done);
            });
            it('Array of objects autocomplete with 4 space indentation check', () => __awaiter(this, void 0, void 0, function* () {
                const languageSettingsSetup = new serviceSetup_1.ServiceSetup().withCompletion().withIndentation('    ');
                languageService.configure(languageSettingsSetup.languageSettings);
                languageService.addSchema(testHelper_1.SCHEMA_ID, {
                    type: 'object',
                    properties: {
                        metadata: {
                            type: 'object',
                            properties: {
                                ownerReferences: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            apiVersion: {
                                                type: 'string',
                                            },
                                            kind: {
                                                type: 'string',
                                            },
                                            name: {
                                                type: 'string',
                                            },
                                            uid: {
                                                type: 'string',
                                            },
                                        },
                                        required: ['apiVersion', 'kind', 'name', 'uid'],
                                    },
                                },
                            },
                        },
                    },
                });
                const content = 'metadata:\n    ownerReferences';
                const completion = yield parseSetup(content, 29);
                chai_1.expect(completion.items[0]).deep.eq(verifyError_1.createExpectedCompletion('ownerReferences', 'ownerReferences:\n    - apiVersion: $1\n      kind: $2\n      name: $3\n      uid: $4', 1, 4, 1, 19, 10, 2, { documentation: '' }));
            }));
        });
        it('Array of objects autocomplete with 2 space indentation check', () => __awaiter(this, void 0, void 0, function* () {
            const languageSettingsSetup = new serviceSetup_1.ServiceSetup().withCompletion().withIndentation('  ');
            languageService.configure(languageSettingsSetup.languageSettings);
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    metadata: {
                        type: 'object',
                        properties: {
                            ownerReferences: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        apiVersion: {
                                            type: 'string',
                                        },
                                        kind: {
                                            type: 'string',
                                        },
                                        name: {
                                            type: 'string',
                                        },
                                        uid: {
                                            type: 'string',
                                        },
                                    },
                                    required: ['apiVersion', 'kind', 'name', 'uid'],
                                },
                            },
                        },
                    },
                },
            });
            const content = 'metadata:\n  ownerReferences';
            const completion = yield parseSetup(content, 27);
            chai_1.expect(completion.items[0]).deep.eq(verifyError_1.createExpectedCompletion('ownerReferences', 'ownerReferences:\n  - apiVersion: $1\n    kind: $2\n    name: $3\n    uid: $4', 1, 2, 1, 17, 10, 2, { documentation: '' }));
        }));
        it('Array of objects autocomplete with 3 space indentation check', () => __awaiter(this, void 0, void 0, function* () {
            const languageSettingsSetup = new serviceSetup_1.ServiceSetup().withCompletion().withIndentation('   ');
            languageService.configure(languageSettingsSetup.languageSettings);
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    metadata: {
                        type: 'object',
                        properties: {
                            ownerReferences: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        apiVersion: {
                                            type: 'string',
                                        },
                                        kind: {
                                            type: 'string',
                                        },
                                        name: {
                                            type: 'string',
                                        },
                                        uid: {
                                            type: 'string',
                                        },
                                    },
                                    required: ['apiVersion', 'kind', 'name', 'uid'],
                                },
                            },
                        },
                    },
                },
            });
            const content = 'metadata:\n   ownerReferences';
            const completion = yield parseSetup(content, 27);
            chai_1.expect(completion.items[0]).deep.eq(verifyError_1.createExpectedCompletion('ownerReferences', 'ownerReferences:\n   - apiVersion: $1\n     kind: $2\n     name: $3\n     uid: $4', 1, 3, 1, 18, 10, 2, { documentation: '' }));
        }));
        it('Object in array with 4 space indentation check', () => __awaiter(this, void 0, void 0, function* () {
            const languageSettingsSetup = new serviceSetup_1.ServiceSetup().withCompletion().withIndentation('    ');
            languageService.configure(languageSettingsSetup.languageSettings);
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    rules: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                },
                                notes: {
                                    type: 'string',
                                },
                                links: {
                                    type: 'array',
                                    items: {
                                        properties: {
                                            rel: {
                                                type: 'string',
                                            },
                                            url: {
                                                type: 'string',
                                            },
                                        },
                                    },
                                },
                                nomination: {
                                    type: 'string',
                                    pattern: '[a-z0-9_]+',
                                },
                                weight: {
                                    type: 'number',
                                    minimum: 1,
                                },
                                criteria: {
                                    type: 'array',
                                    minItems: 1,
                                    items: {
                                        type: 'object',
                                        properties: {
                                            field: {
                                                type: 'string',
                                            },
                                            operator: {
                                                type: 'string',
                                            },
                                            operand: {
                                                type: 'string',
                                            },
                                        },
                                        required: ['field', 'operator', 'operand'],
                                        additionalProperties: false,
                                    },
                                },
                            },
                            required: ['id', 'weight', 'criteria', 'nomination'],
                        },
                    },
                },
            });
            const content = 'rules:\n    -\n';
            const completion = yield parseSetup(content, 11);
            chai_1.expect(completion.items[0].textEdit.newText).equal('- id: $1\n  nomination: $2\n  weight: $3\n  criteria:\n      - field: $4\n        operator: $5\n        operand: $6');
        }));
    });
    describe('JSON Schema 7 Specific Tests', function () {
        it('Autocomplete works with examples', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    foodItems: {
                        type: 'string',
                        examples: ['Apple', 'Banana'],
                        default: 'Carrot',
                    },
                },
            });
            const content = 'foodItems: ';
            const completion = parseSetup(content, 12);
            completion
                .then(function (result) {
                assert.equal(result.items.length, 3);
                assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('Carrot', 'Carrot', 0, 11, 0, 11, 12, 2, {
                    detail: 'Default value',
                }));
                assert.deepEqual(result.items[1], verifyError_1.createExpectedCompletion('Apple', 'Apple', 0, 11, 0, 11, 12, 2, {}));
                assert.deepEqual(result.items[2], verifyError_1.createExpectedCompletion('Banana', 'Banana', 0, 11, 0, 11, 12, 2, {}));
            })
                .then(done, done);
        });
        it('Autocomplete works with const', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    fruit: {
                        const: 'Apple',
                    },
                },
            });
            const content = 'fruit: App';
            const completion = parseSetup(content, 9);
            completion
                .then(function (result) {
                assert.equal(result.items.length, 1);
                assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('Apple', 'Apple', 0, 7, 0, 10, 12, 2, {
                    documentation: undefined,
                }));
            })
                .then(done, done);
        });
    });
    describe('Indentation Specific Tests', function () {
        it('Indent should be considered with position relative to slash', (done) => {
            const schema = require(path.join(__dirname, './fixtures/testArrayIndent.json'));
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'install:\n  - he';
            const completion = parseSetup(content, content.lastIndexOf('he') + 2);
            completion
                .then(function (result) {
                assert.equal(result.items.length, 1);
                assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('helm', 'helm:\n    name: $1', 1, 4, 1, 6, 10, 2, {
                    documentation: '',
                }));
            })
                .then(done, done);
        });
        it('Large indent should be considered with position relative to slash', (done) => {
            const schema = require(path.join(__dirname, './fixtures/testArrayIndent.json'));
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'install:\n -            he';
            const completion = parseSetup(content, content.lastIndexOf('he') + 2);
            completion
                .then(function (result) {
                assert.equal(result.items.length, 1);
                assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('helm', 'helm:\n               name: $1', 1, 14, 1, 16, 10, 2, {
                    documentation: '',
                }));
            })
                .then(done, done);
        });
        it('Tab indent should be considered with position relative to slash', (done) => {
            const schema = require(path.join(__dirname, './fixtures/testArrayIndent.json'));
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'install:\n -\t             he';
            const completion = parseSetup(content, content.lastIndexOf('he') + 2);
            completion
                .then(function (result) {
                assert.equal(result.items.length, 1);
                assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('helm', 'helm:\n \t               name: $1', 1, 16, 1, 18, 10, 2, {
                    documentation: '',
                }));
            })
                .then(done, done);
        });
    });
    describe('Yaml schema defined in file', function () {
        const uri = testHelper_1.toFsPath(path.join(__dirname, './fixtures/testArrayMaxProperties.json'));
        it('Provide completion from schema declared in file', (done) => {
            const content = `# yaml-language-server: $schema=${uri}\n- `;
            const completion = parseSetup(content, content.length);
            completion
                .then(function (result) {
                assert.equal(result.items.length, 3);
            })
                .then(done, done);
        });
        it('Provide completion from schema declared in file with several attributes', (done) => {
            const content = `# yaml-language-server: $schema=${uri} anothermodeline=value\n- `;
            const completion = parseSetup(content, content.length);
            completion
                .then(function (result) {
                assert.equal(result.items.length, 3);
            })
                .then(done, done);
        });
        it('Provide completion from schema declared in file with several documents', (done) => {
            const documentContent1 = `# yaml-language-server: $schema=${uri} anothermodeline=value\n- `;
            const content = `${documentContent1}\n---\n- `;
            const completionDoc1 = parseSetup(content, documentContent1.length);
            completionDoc1.then(function (result) {
                assert.equal(result.items.length, 3, `Expecting 3 items in completion but found ${result.items.length}`);
                const completionDoc2 = parseSetup(content, content.length);
                completionDoc2
                    .then(function (resultDoc2) {
                    assert.equal(resultDoc2.items.length, 0, `Expecting no items in completion but found ${resultDoc2.items.length}`);
                })
                    .then(done, done);
            }, done);
        });
        it('should handle absolute path', () => __awaiter(this, void 0, void 0, function* () {
            const documentContent = `# yaml-language-server: $schema=${path.join(__dirname, './fixtures/testArrayMaxProperties.json')} anothermodeline=value\n- `;
            const content = `${documentContent}\n---\n- `;
            const result = yield parseSetup(content, documentContent.length);
            assert.strictEqual(result.items.length, 3, `Expecting 3 items in completion but found ${result.items.length}`);
        }));
        it('should handle relative path', () => __awaiter(this, void 0, void 0, function* () {
            const documentContent = `# yaml-language-server: $schema=./fixtures/testArrayMaxProperties.json anothermodeline=value\n- `;
            const content = `${documentContent}\n---\n- `;
            const testTextDocument = testHelper_1.setupSchemaIDTextDocument(content, path.join(__dirname, 'test.yaml'));
            yamlSettings.documents = new yamlSettings_1.TextDocumentTestManager();
            yamlSettings.documents.set(testTextDocument);
            const result = yield languageHandler.completionHandler({
                position: testTextDocument.positionAt(documentContent.length),
                textDocument: testTextDocument,
            });
            assert.strictEqual(result.items.length, 3, `Expecting 3 items in completion but found ${result.items.length}`);
        }));
    });
    describe('Configuration based indentation', () => {
        it('4 space indentation', () => __awaiter(void 0, void 0, void 0, function* () {
            const languageSettingsSetup = new serviceSetup_1.ServiceSetup().withCompletion().withIndentation('    ');
            languageService.configure(languageSettingsSetup.languageSettings);
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    scripts: {
                        type: 'object',
                        properties: {
                            sample: {
                                type: 'string',
                                enum: ['test'],
                            },
                            myOtherSample: {
                                type: 'string',
                                enum: ['test'],
                            },
                        },
                    },
                },
            });
            const content = 'scripts:\n    sample: test\n    myOther';
            const completion = yield parseSetup(content, 34);
            assert.strictEqual(completion.items.length, 1);
            assert.deepStrictEqual(completion.items[0], verifyError_1.createExpectedCompletion('myOtherSample', 'myOtherSample: ${1:test}', 2, 4, 2, 11, 10, 2, {
                documentation: '',
            }));
        }));
    });
    describe('Bug fixes', () => {
        it('Object in array completion indetetion', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    components: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                },
                                settings: {
                                    type: 'object',
                                    required: ['data'],
                                    properties: {
                                        data: {
                                            type: 'object',
                                            required: ['arrayItems'],
                                            properties: {
                                                arrayItems: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        required: ['id'],
                                                        properties: {
                                                            show: {
                                                                type: 'boolean',
                                                                default: true,
                                                            },
                                                            id: {
                                                                type: 'string',
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            const content = 'components:\n  - id: jsakdh\n    setti';
            const completion = yield parseSetup(content, 36);
            chai_1.expect(completion.items).lengthOf(1);
            chai_1.expect(completion.items[0].textEdit.newText).to.equal('settings:\n  data:\n    arrayItems:\n      - show: ${1:true}\n        id: $2');
        }));
        it('Object completion', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    env: {
                        type: 'object',
                        default: {
                            KEY: 'VALUE',
                        },
                    },
                },
            });
            const content = 'env: ';
            const completion = parseSetup(content, 5);
            completion
                .then(function (result) {
                assert.equal(result.items.length, 1);
                assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('Default value', '\n  ${1:KEY}: ${2:VALUE}\n', 0, 5, 0, 5, 9, 2, {
                    detail: 'Default value',
                }));
            })
                .then(done, done);
        });
        it('Complex default object completion', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    env: {
                        type: 'object',
                        default: {
                            KEY: 'VALUE',
                            KEY2: {
                                TEST: 'TEST2',
                            },
                            KEY3: ['Test', 'Test2'],
                        },
                    },
                },
            });
            const content = 'env: ';
            const completion = parseSetup(content, 5);
            completion
                .then(function (result) {
                assert.equal(result.items.length, 1);
                assert.deepEqual(result.items[0], verifyError_1.createExpectedCompletion('Default value', '\n  ${1:KEY}: ${2:VALUE}\n  ${3:KEY2}:\n    ${4:TEST}: ${5:TEST2}\n  ${6:KEY3}:\n    - ${7:Test}\n    - ${8:Test2}\n', 0, 5, 0, 5, 9, 2, {
                    detail: 'Default value',
                }));
            })
                .then(done, done);
        });
        it('should handle array schema without items', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'array',
                items: {
                    anyOf: [
                        {
                            type: 'object',
                            properties: {
                                fooBar: {
                                    type: 'object',
                                    properties: {
                                        name: {
                                            type: 'string',
                                        },
                                        aaa: {
                                            type: 'array',
                                        },
                                    },
                                    required: ['name', 'aaa'],
                                },
                            },
                        },
                    ],
                },
            });
            const content = '---\n- \n';
            const completion = yield parseSetup(content, 6);
            chai_1.expect(completion.items).lengthOf(1);
            chai_1.expect(completion.items[0].label).eq('fooBar');
            chai_1.expect(completion.items[0].insertText).eq('fooBar:\n    name: $1\n    aaa:\n      - $2');
        }));
        it('should complete string which contains number in default value', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    env: {
                        type: 'integer',
                        default: '1',
                    },
                    enum: {
                        type: 'string',
                        default: '1',
                    },
                },
            });
            const content = 'enum';
            const completion = yield parseSetup(content, 3);
            const enumItem = completion.items.find((i) => i.label === 'enum');
            chai_1.expect(enumItem).to.not.undefined;
            chai_1.expect(enumItem.textEdit.newText).equal('enum: ${1:"1"}');
            const envItem = completion.items.find((i) => i.label === 'env');
            chai_1.expect(envItem).to.not.undefined;
            chai_1.expect(envItem.textEdit.newText).equal('env: ${1:1}');
        }));
        it('should complete string which contains number in examples values', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    fooBar: {
                        type: 'string',
                        examples: ['test', '1', 'true'],
                    },
                },
            });
            const content = 'fooBar: \n';
            const completion = yield parseSetup(content, 8);
            const testItem = completion.items.find((i) => i.label === 'test');
            chai_1.expect(testItem).to.not.undefined;
            chai_1.expect(testItem.textEdit.newText).equal('test');
            const oneItem = completion.items.find((i) => i.label === '1');
            chai_1.expect(oneItem).to.not.undefined;
            chai_1.expect(oneItem.textEdit.newText).equal('"1"');
            const trueItem = completion.items.find((i) => i.label === 'true');
            chai_1.expect(trueItem).to.not.undefined;
            chai_1.expect(trueItem.textEdit.newText).equal('"true"');
        }));
        it('should provide label as string for examples completion item', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    fooBar: {
                        type: 'array',
                        items: {
                            type: 'string',
                            examples: ['test'],
                        },
                    },
                },
            });
            const content = 'fooBar: \n';
            const completion = yield parseSetup(content, 8);
            chai_1.expect(completion.items).length(1);
        }));
        it('should provide completion for flow map', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: { A: { type: 'string', enum: ['a1', 'a2'] }, B: { type: 'string', enum: ['b1', 'b2'] } },
            });
            const content = '{A: , B: b1}';
            const completion = yield parseSetup(content, 4);
            chai_1.expect(completion.items).lengthOf(2);
            chai_1.expect(completion.items[0]).eql(verifyError_1.createExpectedCompletion('a1', 'a1', 0, 4, 0, 4, 12, vscode_languageserver_1.InsertTextFormat.Snippet, { documentation: undefined }));
            chai_1.expect(completion.items[1]).eql(verifyError_1.createExpectedCompletion('a2', 'a2', 0, 4, 0, 4, 12, vscode_languageserver_1.InsertTextFormat.Snippet, { documentation: undefined }));
        }));
        it('should provide completion for "null" enum value', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    kind: {
                        enum: ['project', null],
                    },
                },
            });
            const content = 'kind: \n';
            const completion = yield parseSetup(content, 6);
            chai_1.expect(completion.items).lengthOf(2);
            chai_1.expect(completion.items[0]).eql(verifyError_1.createExpectedCompletion('project', 'project', 0, 6, 0, 6, 12, vscode_languageserver_1.InsertTextFormat.Snippet, { documentation: undefined }));
            chai_1.expect(completion.items[1]).eql(verifyError_1.createExpectedCompletion('null', 'null', 0, 6, 0, 6, 12, vscode_languageserver_1.InsertTextFormat.Snippet, { documentation: undefined }));
        }));
        it('should provide completion for empty file', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                oneOf: [
                    {
                        type: 'object',
                        description: 'dummy schema',
                    },
                    {
                        properties: {
                            kind: {
                                type: 'string',
                            },
                        },
                        type: 'object',
                        additionalProperties: false,
                    },
                    {
                        properties: {
                            name: {
                                type: 'string',
                            },
                        },
                        type: 'object',
                        additionalProperties: false,
                    },
                ],
            });
            const content = ' \n\n\n';
            const completion = yield parseSetup(content, 3);
            chai_1.expect(completion.items).lengthOf(2);
            chai_1.expect(completion.items[0]).eql(verifyError_1.createExpectedCompletion('kind', 'kind: $1', 2, 0, 2, 0, 10, vscode_languageserver_1.InsertTextFormat.Snippet, { documentation: '' }));
            chai_1.expect(completion.items[1]).eql(verifyError_1.createExpectedCompletion('name', 'name: $1', 2, 0, 2, 0, 10, vscode_languageserver_1.InsertTextFormat.Snippet, { documentation: '' }));
        }));
        it('should not provide additional ":" on existing property completion', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    kind: {
                        type: 'string',
                    },
                },
                required: ['kind'],
            });
            const content = 'kind: 111\n';
            const completion = yield parseSetup(content, 3);
            chai_1.expect(completion.items).lengthOf(1);
            chai_1.expect(completion.items[0]).eql(verifyError_1.createExpectedCompletion('kind', 'kind', 0, 0, 0, 4, 10, vscode_languageserver_1.InsertTextFormat.Snippet, { documentation: '' }));
        }));
        it('should not provide additional ":" on existing property completion when try to complete partial property', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    kind: {
                        type: 'string',
                    },
                },
                required: ['kind'],
            });
            const content = 'ki: 111\n';
            const completion = yield parseSetup(content, 1);
            chai_1.expect(completion.items).lengthOf(1);
            chai_1.expect(completion.items[0]).eql(verifyError_1.createExpectedCompletion('kind', 'kind', 0, 0, 0, 2, 10, vscode_languageserver_1.InsertTextFormat.Snippet, { documentation: '' }));
        }));
        it('should use markdownDescription for property completion', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    kind: {
                        type: 'string',
                        description: 'Kind is a string value representing the REST',
                        markdownDescription: '**kind** (string)\n\nKind is a string value representing the REST resource this object represents.',
                    },
                },
                required: ['kind'],
            });
            const content = 'kin';
            const completion = yield parseSetup(content, 1);
            chai_1.expect(completion.items).lengthOf(1);
            chai_1.expect(completion.items[0]).eql(verifyError_1.createExpectedCompletion('kind', 'kind: $1', 0, 0, 0, 3, 10, vscode_languageserver_1.InsertTextFormat.Snippet, {
                documentation: {
                    kind: vscode_languageserver_1.MarkupKind.Markdown,
                    value: '**kind** (string)\n\nKind is a string value representing the REST resource this object represents.',
                },
            }));
        }));
        it('should follow $ref in additionalItems', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    test: {
                        $ref: '#/definitions/Recur',
                    },
                },
                definitions: {
                    Recur: {
                        type: 'array',
                        items: [
                            {
                                type: 'string',
                                enum: ['and'],
                            },
                        ],
                        additionalItems: {
                            $ref: '#/definitions/Recur',
                        },
                    },
                },
            });
            const content = 'test:\n  - and\n  - - ';
            const completion = yield parseSetup(content, 19);
            chai_1.expect(completion.items).lengthOf(1);
            chai_1.expect(completion.items[0]).eql(verifyError_1.createExpectedCompletion('and', 'and', 2, 4, 2, 5, 12, vscode_languageserver_1.InsertTextFormat.Snippet, { documentation: undefined }));
        }));
        it('should follow $ref in additionalItems for flow style array', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    test: {
                        $ref: '#/definitions/Recur',
                    },
                },
                definitions: {
                    Recur: {
                        type: 'array',
                        items: [
                            {
                                type: 'string',
                                enum: ['and'],
                            },
                        ],
                        additionalItems: {
                            $ref: '#/definitions/Recur',
                        },
                    },
                },
            });
            const content = 'test:\n  - and\n  - []';
            const completion = yield parseSetup(content, 18);
            chai_1.expect(completion.items).lengthOf(1);
            chai_1.expect(completion.items[0]).eql(verifyError_1.createExpectedCompletion('and', 'and', 2, 4, 2, 4, 12, vscode_languageserver_1.InsertTextFormat.Snippet, { documentation: undefined }));
        }));
        it('completion should handle bad schema', () => __awaiter(void 0, void 0, void 0, function* () {
            const doc = testHelper_1.setupSchemaIDTextDocument('foo:\n bar', 'bad-schema.yaml');
            yamlSettings.documents = new yamlSettings_1.TextDocumentTestManager();
            yamlSettings.documents.set(doc);
            const result = yield languageHandler.completionHandler({
                position: vscode_languageserver_1.Position.create(0, 1),
                textDocument: doc,
            });
            chai_1.expect(result.items).to.be.empty;
        }));
    });
    describe('Array completion', () => {
        it('Simple array object completion with "-" without any item', () => __awaiter(void 0, void 0, void 0, function* () {
            const schema = require(path.join(__dirname, './fixtures/testArrayCompletionSchema.json'));
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'test_simpleArrayObject:\n  -';
            const completion = parseSetup(content, content.length);
            completion.then(function (result) {
                assert.equal(result.items.length, 1);
                assert.equal(result.items[0].label, '- (array item)');
            });
        }));
        it('Simple array object completion without "-" after array item', () => __awaiter(void 0, void 0, void 0, function* () {
            const schema = require(path.join(__dirname, './fixtures/testArrayCompletionSchema.json'));
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'test_simpleArrayObject:\n  - obj1:\n      name: 1\n  ';
            const completion = parseSetup(content, content.length);
            completion.then(function (result) {
                assert.equal(result.items.length, 1);
                assert.equal(result.items[0].label, '- (array item)');
            });
        }));
        it('Simple array object completion with "-" after array item', () => __awaiter(void 0, void 0, void 0, function* () {
            const schema = require(path.join(__dirname, './fixtures/testArrayCompletionSchema.json'));
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'test_simpleArrayObject:\n  - obj1:\n      name: 1\n  -';
            const completion = parseSetup(content, content.length);
            completion.then(function (result) {
                assert.equal(result.items.length, 1);
                assert.equal(result.items[0].label, '- (array item)');
            });
        }));
        it('Array anyOf two objects completion with "- " without any item', () => __awaiter(void 0, void 0, void 0, function* () {
            const schema = require(path.join(__dirname, './fixtures/testArrayCompletionSchema.json'));
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'test_array_anyOf_2objects:\n  - ';
            const completion = parseSetup(content, content.length);
            completion.then(function (result) {
                assert.equal(result.items.length, 2);
                assert.equal(result.items[0].label, 'obj1');
            });
        }));
        it('Array anyOf two objects completion with "-" without any item', () => __awaiter(void 0, void 0, void 0, function* () {
            const schema = require(path.join(__dirname, './fixtures/testArrayCompletionSchema.json'));
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'test_array_anyOf_2objects:\n  -';
            const completion = parseSetup(content, content.length);
            completion.then(function (result) {
                assert.equal(result.items.length, 2);
                assert.equal(result.items[0].label, '- (array item) 1');
            });
        }));
        it('Array anyOf two objects completion without "-" after array item', () => __awaiter(void 0, void 0, void 0, function* () {
            const schema = require(path.join(__dirname, './fixtures/testArrayCompletionSchema.json'));
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'test_array_anyOf_2objects:\n  - obj1:\n      name: 1\n  ';
            const completion = parseSetup(content, content.length);
            completion.then(function (result) {
                assert.equal(result.items.length, 2);
                assert.equal(result.items[0].label, '- (array item) 1');
            });
        }));
        it('Array anyOf two objects completion with "-" after array item', () => __awaiter(void 0, void 0, void 0, function* () {
            const schema = require(path.join(__dirname, './fixtures/testArrayCompletionSchema.json'));
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'test_array_anyOf_2objects:\n  - obj1:\n      name: 1\n  -';
            const completion = parseSetup(content, content.length);
            completion.then(function (result) {
                assert.equal(result.items.length, 2);
                assert.equal(result.items[0].label, '- (array item) 1');
            });
        }));
        it('Array anyOf two objects completion indentation', () => __awaiter(void 0, void 0, void 0, function* () {
            const schema = require(path.join(__dirname, './fixtures/testArrayCompletionSchema.json'));
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'test_array_anyOf_2objects:\n  - obj';
            const completion = yield parseSetup(content, content.length);
            chai_1.expect(completion.items.length).is.equal(2);
            const obj1 = completion.items.find((it) => it.label === 'obj1');
            chai_1.expect(obj1).is.not.undefined;
            chai_1.expect(obj1.textEdit.newText).equal('obj1:\n    ');
        }));
    });
});
//# sourceMappingURL=autoCompletion.test.js.map