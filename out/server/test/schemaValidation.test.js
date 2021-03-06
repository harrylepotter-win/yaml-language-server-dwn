"use strict";
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
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const testHelper_1 = require("./utils/testHelper");
const verifyError_1 = require("./utils/verifyError");
const serviceSetup_1 = require("./utils/serviceSetup");
const errorMessages_1 = require("./utils/errorMessages");
const assert = require("assert");
const path = require("path");
const vscode_languageserver_1 = require("vscode-languageserver");
const chai_1 = require("chai");
const yamlSettings_1 = require("../src/yamlSettings");
const schemaUrls_1 = require("../src/languageservice/utils/schemaUrls");
describe('Validation Tests', () => {
    let languageSettingsSetup;
    let validationHandler;
    let languageService;
    let yamlSettings;
    before(() => {
        languageSettingsSetup = new serviceSetup_1.ServiceSetup()
            .withValidate()
            .withCustomTags(['!Test', '!Ref sequence'])
            .withSchemaFileMatch({ uri: schemaUrls_1.KUBERNETES_SCHEMA_URL, fileMatch: ['.drone.yml'] })
            .withSchemaFileMatch({ uri: 'https://json.schemastore.org/drone', fileMatch: ['.drone.yml'] })
            .withSchemaFileMatch({ uri: schemaUrls_1.KUBERNETES_SCHEMA_URL, fileMatch: ['test.yml'] })
            .withSchemaFileMatch({
            uri: 'https://raw.githubusercontent.com/composer/composer/master/res/composer-schema.json',
            fileMatch: ['test.yml'],
        });
        const { languageService: langService, validationHandler: valHandler, yamlSettings: settings } = testHelper_1.setupLanguageService(languageSettingsSetup.languageSettings);
        languageService = langService;
        validationHandler = valHandler;
        yamlSettings = settings;
    });
    function parseSetup(content, customSchemaID) {
        const testTextDocument = testHelper_1.setupSchemaIDTextDocument(content, customSchemaID);
        yamlSettings.documents = new yamlSettings_1.TextDocumentTestManager();
        yamlSettings.documents.set(testTextDocument);
        return validationHandler.validateTextDocument(testTextDocument);
    }
    afterEach(() => {
        languageService.deleteSchema(testHelper_1.SCHEMA_ID);
    });
    describe('Boolean tests', () => {
        it('Boolean true test', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    analytics: {
                        type: 'boolean',
                    },
                },
            });
            const content = 'analytics: true';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Basic false test', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    analytics: {
                        type: 'boolean',
                    },
                },
            });
            const content = 'analytics: false';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Test that boolean value without quotations is valid', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    analytics: {
                        type: 'boolean',
                    },
                },
            });
            const content = 'analytics: no';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Test that boolean value in quotations is interpreted as string not boolean', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    analytics: {
                        type: 'boolean',
                    },
                },
            });
            const content = 'analytics: "no"';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.strictEqual(result.length, 1);
                assert.deepStrictEqual(result[0], verifyError_1.createDiagnosticWithData(errorMessages_1.BooleanTypeError, 0, 11, 0, 15, vscode_languageserver_1.DiagnosticSeverity.Error, `yaml-schema: file:///${testHelper_1.SCHEMA_ID}`, `file:///${testHelper_1.SCHEMA_ID}`));
            })
                .then(done, done);
        });
        it('Error on incorrect value type (boolean)', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    cwd: {
                        type: 'string',
                    },
                },
            });
            const content = 'cwd: False';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 1);
                assert.deepEqual(result[0], verifyError_1.createDiagnosticWithData(errorMessages_1.StringTypeError, 0, 5, 0, 10, vscode_languageserver_1.DiagnosticSeverity.Error, `yaml-schema: file:///${testHelper_1.SCHEMA_ID}`, `file:///${testHelper_1.SCHEMA_ID}`));
            })
                .then(done, done);
        });
    });
    describe('String tests', () => {
        it('Test that boolean inside of quotations is of type string', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    analytics: {
                        type: 'string',
                    },
                },
            });
            const content = 'analytics: "no"';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Type string validates under children', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    scripts: {
                        type: 'object',
                        properties: {
                            register: {
                                type: 'string',
                            },
                        },
                    },
                },
            });
            const content = 'registry:\n  register: file://test_url';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Type String does not error on valid node', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    cwd: {
                        type: 'string',
                    },
                },
            });
            const content = 'cwd: this';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Error on incorrect value type (string)', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    analytics: {
                        type: 'boolean',
                    },
                },
            });
            const content = 'analytics: hello';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 1);
                assert.deepEqual(result[0], verifyError_1.createDiagnosticWithData(errorMessages_1.BooleanTypeError, 0, 11, 0, 16, vscode_languageserver_1.DiagnosticSeverity.Error, `yaml-schema: file:///${testHelper_1.SCHEMA_ID}`, `file:///${testHelper_1.SCHEMA_ID}`));
            })
                .then(done, done);
        });
        it('Test that boolean is invalid when no strings present and schema wants string', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    cwd: {
                        type: 'string',
                    },
                },
            });
            const content = 'cwd: no';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 1);
                assert.deepEqual(result[0], verifyError_1.createDiagnosticWithData(errorMessages_1.StringTypeError, 0, 5, 0, 7, vscode_languageserver_1.DiagnosticSeverity.Error, `yaml-schema: file:///${testHelper_1.SCHEMA_ID}`, `file:///${testHelper_1.SCHEMA_ID}`));
            })
                .then(done, done);
        });
    });
    describe('Number tests', () => {
        it('Type Number does not error on valid node', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    timeout: {
                        type: 'number',
                    },
                },
            });
            const content = 'timeout: 60000';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Error on incorrect value type (number)', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    cwd: {
                        type: 'string',
                    },
                },
            });
            const content = 'cwd: 100000';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 1);
                assert.deepEqual(result[0], verifyError_1.createDiagnosticWithData(errorMessages_1.StringTypeError, 0, 5, 0, 11, vscode_languageserver_1.DiagnosticSeverity.Error, `yaml-schema: file:///${testHelper_1.SCHEMA_ID}`, `file:///${testHelper_1.SCHEMA_ID}`));
            })
                .then(done, done);
        });
    });
    describe('Object tests', () => {
        it('Basic test on nodes with children', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    scripts: {
                        type: 'object',
                        properties: {
                            preinstall: {
                                type: 'string',
                            },
                            postinstall: {
                                type: 'string',
                            },
                        },
                    },
                },
            });
            const content = 'scripts:\n  preinstall: test1\n  postinstall: test2';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Test with multiple nodes with children', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    analytics: {
                        type: 'boolean',
                    },
                    cwd: {
                        type: 'string',
                    },
                    scripts: {
                        type: 'object',
                        properties: {
                            preinstall: {
                                type: 'string',
                            },
                            postinstall: {
                                type: 'string',
                            },
                        },
                    },
                },
            });
            const content = 'analytics: true\ncwd: this\nscripts:\n  preinstall: test1\n  postinstall: test2';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Type Object does not error on valid node', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    registry: {
                        type: 'object',
                        properties: {
                            search: {
                                type: 'string',
                            },
                        },
                    },
                },
            });
            const content = 'registry:\n  search: file://test_url';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Error on incorrect value type (object)', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    scripts: {
                        type: 'object',
                        properties: {
                            search: {
                                type: 'string',
                            },
                        },
                    },
                },
            });
            const content = 'scripts: test';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 1);
                assert.deepEqual(result[0], verifyError_1.createDiagnosticWithData(errorMessages_1.ObjectTypeError, 0, 9, 0, 13, vscode_languageserver_1.DiagnosticSeverity.Error, `yaml-schema: file:///${testHelper_1.SCHEMA_ID}`, `file:///${testHelper_1.SCHEMA_ID}`));
            })
                .then(done, done);
        });
    });
    describe('Array tests', () => {
        it('Type Array does not error on valid node', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    resolvers: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                    },
                },
            });
            const content = 'resolvers:\n  - test\n  - test\n  - test';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Error on incorrect value type (array)', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    resolvers: {
                        type: 'array',
                    },
                },
            });
            const content = 'resolvers: test';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 1);
                assert.deepEqual(result[0], verifyError_1.createDiagnosticWithData(errorMessages_1.ArrayTypeError, 0, 11, 0, 15, vscode_languageserver_1.DiagnosticSeverity.Error, `yaml-schema: file:///${testHelper_1.SCHEMA_ID}`, `file:///${testHelper_1.SCHEMA_ID}`));
            })
                .then(done, done);
        });
    });
    describe('Anchor tests', () => {
        it('Anchor should not error', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    default: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                            },
                        },
                    },
                },
            });
            const content = 'default: &DEFAULT\n  name: Anchor\nanchor_test:\n  <<: *DEFAULT';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Anchor with multiple references should not error', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    default: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                            },
                        },
                    },
                },
            });
            const content = 'default: &DEFAULT\n  name: Anchor\nanchor_test:\n  <<: *DEFAULT\nanchor_test2:\n  <<: *DEFAULT';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Multiple Anchor in array of references should not error', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    default: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                            },
                        },
                    },
                },
            });
            const content = 'default: &DEFAULT\n  name: Anchor\ncustomname: &CUSTOMNAME\n  custom_name: Anchor\nanchor_test:\n  <<: [*DEFAULT, *CUSTOMNAME]';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Multiple Anchors being referenced in same level at same time', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    customize: {
                        type: 'object',
                        properties: {
                            register: {
                                type: 'string',
                            },
                        },
                    },
                },
            });
            const content = 'default: &DEFAULT\n  name: Anchor\ncustomname: &CUSTOMNAME\n  custom_name: Anchor\nanchor_test:\n  <<: *DEFAULT\n  <<: *CUSTOMNAME\n';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Nested object anchors should expand properly', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                additionalProperties: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        akey: {
                            type: 'string',
                        },
                    },
                    required: ['akey'],
                },
            });
            const content = `
        l1: &l1
          akey: avalue

        l2: &l2
          <<: *l1

        l3: &l3
          <<: *l2

        l4:
          <<: *l3
      `;
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Anchor reference with a validation error in a sub-object emits the error in the right location', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    src: {},
                    dest: {
                        type: 'object',
                        properties: {
                            outer: {
                                type: 'object',
                                required: ['otherkey'],
                            },
                        },
                    },
                },
                required: ['src', 'dest'],
            });
            const content = `
        src: &src
          outer:
            akey: avalue

        dest:
          <<: *src
      `;
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 1);
                // The key thing we're checking is *where* the validation error gets reported.
                // "outer" isn't required to contain "otherkey" inside "src", but it is inside
                // "dest". Since "outer" doesn't appear inside "dest" because of the alias, we
                // need to move the error into "src".
                assert.deepEqual(result[0], verifyError_1.createDiagnosticWithData(errorMessages_1.MissingRequiredPropWarning.replace('{0}', 'otherkey'), 2, 10, 2, 15, vscode_languageserver_1.DiagnosticSeverity.Error, `yaml-schema: file:///${testHelper_1.SCHEMA_ID}`, `file:///${testHelper_1.SCHEMA_ID}`));
            })
                .then(done, done);
        });
        it('Array Anchor merge', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    arr: {
                        type: 'array',
                        items: {
                            type: 'number',
                        },
                    },
                    obj: {
                        properties: {
                            arr2: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            });
            const content = `
arr: &a
  - 1
  - 2
obj:
  <<: *a
  arr2:
    - << *a
`;
            const result = yield parseSetup(content);
            assert.equal(result.length, 0);
        }));
    });
    describe('Custom tag tests', () => {
        it('Custom Tags without type', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    analytics: {
                        type: 'boolean',
                    },
                },
            });
            const content = 'analytics: !Test false';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Custom Tags with type', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    resolvers: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                    },
                },
            });
            const content = 'resolvers: !Ref\n  - test';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Include with value should not error', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    customize: {
                        type: 'string',
                    },
                },
            });
            const content = 'customize: !include customize.yaml';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Include without value should error', (done) => {
            const content = 'customize: !include';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 1);
                assert.deepEqual(result[0], verifyError_1.createExpectedError(errorMessages_1.IncludeWithoutValueError, 0, 19, 0, 19));
            })
                .then(done, done);
        });
    });
    describe('Multiple type tests', function () {
        it('Do not error when there are multiple types in schema and theyre valid', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    license: {
                        type: ['string', 'boolean'],
                    },
                },
            });
            const content = 'license: MIT';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
    });
    describe('Invalid YAML errors', function () {
        it('Error when theres a finished untyped item', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    cwd: {
                        type: 'string',
                    },
                    analytics: {
                        type: 'boolean',
                    },
                },
            });
            const content = 'cwd: hello\nan';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 2);
                assert.deepEqual(result[0], verifyError_1.createExpectedError(errorMessages_1.BlockMappingEntryError, 1, 2, 1, 2));
                assert.deepEqual(result[1], verifyError_1.createExpectedError(errorMessages_1.ColonMissingError, 1, 2, 1, 2));
            })
                .then(done, done);
        });
        it('Error when theres no value for a node', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    cwd: {
                        type: 'string',
                    },
                },
            });
            const content = 'cwd:';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 1);
                assert.deepEqual(result[0], verifyError_1.createDiagnosticWithData(errorMessages_1.StringTypeError, 0, 4, 0, 4, vscode_languageserver_1.DiagnosticSeverity.Error, `yaml-schema: file:///${testHelper_1.SCHEMA_ID}`, `file:///${testHelper_1.SCHEMA_ID}`));
            })
                .then(done, done);
        });
    });
    describe('Test with no schemas', () => {
        it('Duplicate properties are reported', (done) => {
            const content = 'kind: a\ncwd: b\nkind: c';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 2);
                assert.deepEqual(result[0], verifyError_1.createExpectedError(errorMessages_1.DuplicateKeyError, 2, 0, 2, 1));
                assert.deepEqual(result[1], verifyError_1.createExpectedError(errorMessages_1.DuplicateKeyError, 0, 0, 0, 1));
            })
                .then(done, done);
        });
    });
    describe('Test anchors', function () {
        it('Test that anchors with a schema do not report Property << is not allowed', (done) => {
            const schema = {
                type: 'object',
                properties: {
                    sample: {
                        type: 'object',
                        properties: {
                            prop1: {
                                type: 'string',
                            },
                            prop2: {
                                type: 'string',
                            },
                        },
                        additionalProperties: false,
                    },
                },
                $schema: 'http://json-schema.org/draft-07/schema#',
            };
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'test: &test\n  prop1: hello\nsample:\n  <<: *test\n  prop2: another_test';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
    });
    describe('Test with custom kubernetes schemas', function () {
        it('Test that properties that match multiple enums get validated properly', (done) => {
            languageService.configure(languageSettingsSetup.withKubernetes().languageSettings);
            yamlSettings.specificValidatorPaths = ['*.yml', '*.yaml'];
            const schema = {
                definitions: {
                    ImageStreamImport: {
                        type: 'object',
                        properties: {
                            kind: {
                                type: 'string',
                                enum: ['ImageStreamImport'],
                            },
                        },
                    },
                    ImageStreamLayers: {
                        type: 'object',
                        properties: {
                            kind: {
                                type: 'string',
                                enum: ['ImageStreamLayers'],
                            },
                        },
                    },
                },
                oneOf: [
                    {
                        $ref: '#/definitions/ImageStreamImport',
                    },
                    {
                        $ref: '#/definitions/ImageStreamLayers',
                    },
                ],
            };
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'kind: ';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 2);
                // eslint-disable-next-line
                assert.equal(result[1].message, `Value is not accepted. Valid values: "ImageStreamImport", "ImageStreamLayers".`);
            })
                .then(done, done);
        });
    });
    // https://github.com/redhat-developer/yaml-language-server/issues/118
    describe('Null literals', () => {
        ['NULL', 'Null', 'null', '~', ''].forEach((content) => {
            it(`Test type null is parsed from [${content}]`, (done) => {
                const schema = {
                    type: 'object',
                    properties: {
                        nulltest: {
                            type: 'null',
                        },
                    },
                };
                languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
                const validator = parseSetup('nulltest: ' + content);
                validator
                    .then(function (result) {
                    assert.equal(result.length, 0);
                })
                    .then(done, done);
            });
        });
        it('Test type null is working correctly in array', (done) => {
            const schema = {
                properties: {
                    values: {
                        type: 'array',
                        items: {
                            type: 'null',
                        },
                    },
                },
                required: ['values'],
            };
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = 'values: [Null, NULL, null, ~,]';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
    });
    describe('Multi Document schema validation tests', () => {
        it('Document does not error when --- is present with schema', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    cwd: {
                        type: 'string',
                    },
                },
            });
            const content = '---\n# this is a test\ncwd: this';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
        it('Multi Document does not error when --- is present with schema', (done) => {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    cwd: {
                        type: 'string',
                    },
                },
            });
            const content = '---\n# this is a test\ncwd: this...\n---\n# second comment\ncwd: hello\n...';
            const validator = parseSetup(content);
            validator
                .then(function (result) {
                assert.equal(result.length, 0);
            })
                .then(done, done);
        });
    });
    describe('Schema with title', () => {
        it('validator uses schema title instead of url', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                title: 'Schema Super title',
                properties: {
                    analytics: {
                        type: 'string',
                    },
                },
            });
            const content = 'analytics: 1';
            const result = yield parseSetup(content);
            chai_1.expect(result[0]).deep.equal(verifyError_1.createDiagnosticWithData(errorMessages_1.StringTypeError, 0, 11, 0, 12, vscode_languageserver_1.DiagnosticSeverity.Error, 'yaml-schema: Schema Super title', 'file:///default_schema_id.yaml'));
        }));
    });
    describe('Multiple schema for single file', () => {
        after(() => {
            // remove Kubernetes setting not to affect next tests
            languageService.configure(languageSettingsSetup.withKubernetes(false).languageSettings);
            yamlSettings.specificValidatorPaths = [];
        });
        it('should add proper source to diagnostic', () => __awaiter(void 0, void 0, void 0, function* () {
            const content = `
      abandoned: v1
      archive:
        exclude:
          asd: asd`;
            languageService.configure(languageSettingsSetup.withKubernetes().languageSettings);
            yamlSettings.specificValidatorPaths = ['*.yml', '*.yaml'];
            const result = yield parseSetup(content, 'file://~/Desktop/vscode-yaml/test.yml');
            chai_1.expect(result[0]).deep.equal(verifyError_1.createDiagnosticWithData(errorMessages_1.ArrayTypeError, 4, 10, 4, 18, vscode_languageserver_1.DiagnosticSeverity.Error, 'yaml-schema: Package', 'https://raw.githubusercontent.com/composer/composer/master/res/composer-schema.json'));
        }));
        it('should add proper source to diagnostic in case of drone', () => __awaiter(void 0, void 0, void 0, function* () {
            const content = `
      apiVersion: v1
      kind: Deployment
      `;
            const result = yield parseSetup(content, 'file://~/Desktop/vscode-yaml/.drone.yml');
            chai_1.expect(result[5]).deep.equal(verifyError_1.createDiagnosticWithData(errorMessages_1.propertyIsNotAllowed('apiVersion'), 1, 6, 1, 16, vscode_languageserver_1.DiagnosticSeverity.Error, 'yaml-schema: Drone CI configuration file', 'https://json.schemastore.org/drone'));
        }));
    });
    describe('Conditional Schema', () => {
        it('validator use "then" block if "if" valid', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                default: [],
                properties: {
                    name: {
                        type: 'string',
                    },
                    var: {
                        type: 'string',
                    },
                },
                if: {
                    properties: {
                        var: {
                            type: 'string',
                        },
                    },
                },
                then: {
                    required: ['pineapple'],
                },
                else: {
                    required: ['tomato'],
                },
                additionalProperties: true,
            });
            const content = `
      name: aName
      var: something
      inputs:`;
            const result = yield parseSetup(content);
            chai_1.expect(result[0].message).to.eq('Missing property "pineapple".');
        }));
    });
    describe('Schema with uri-reference', () => {
        it('should validate multiple uri-references', () => __awaiter(void 0, void 0, void 0, function* () {
            const schemaWithURIReference = {
                type: 'object',
                properties: {
                    one: {
                        type: 'string',
                        format: 'uri-reference',
                    },
                },
            };
            languageService.addSchema(testHelper_1.SCHEMA_ID, schemaWithURIReference);
            let content = `
      one: '//foo/bar'
      `;
            let result = yield parseSetup(content);
            chai_1.expect(result.length).to.eq(0);
            content = `
      one: '#/components/schemas/service'
      `;
            result = yield parseSetup(content);
            chai_1.expect(result.length).to.eq(0);
            content = `
      one: 'some/relative/path/foo.schema.yaml'
      `;
            result = yield parseSetup(content);
            chai_1.expect(result.length).to.eq(0);
            content = `
      one: 'http://foo/bar'
      `;
            result = yield parseSetup(content);
            chai_1.expect(result.length).to.eq(0);
        }));
        it('should not validate empty uri-reference', () => __awaiter(void 0, void 0, void 0, function* () {
            const schemaWithURIReference = {
                type: 'object',
                properties: {
                    one: {
                        type: 'string',
                        format: 'uri-reference',
                    },
                },
            };
            languageService.addSchema(testHelper_1.SCHEMA_ID, schemaWithURIReference);
            const content = `
      one: ''
      `;
            const result = yield parseSetup(content);
            chai_1.expect(result.length).to.eq(1);
            chai_1.expect(result[0].message).to.eq('String is not a URI: URI expected.');
        }));
    });
    describe('Multiple similar schemas validation', () => {
        const sharedSchemaId = 'sharedSchema.json';
        before(() => {
            // remove Kubernetes setting set by previous test
            languageService.configure(languageSettingsSetup.withKubernetes(false).languageSettings);
            yamlSettings.specificValidatorPaths = [];
        });
        afterEach(() => {
            languageService.deleteSchema(sharedSchemaId);
        });
        it('should distinguish types in error "Incorrect type (Expected "type1 | type2 | type3")"', () => __awaiter(void 0, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const schema = require(path.join(__dirname, './fixtures/testMultipleSimilarSchema.json'));
            languageService.addSchema(sharedSchemaId, schema.sharedSchema);
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema.schema);
            const content = 'test_anyOf_objects:\n  ';
            const result = yield parseSetup(content);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].message, 'Incorrect type. Expected "type1 | type2 | type3".');
            assert.strictEqual(result[0].source, 'yaml-schema: file:///sharedSchema.json | file:///default_schema_id.yaml');
            assert.deepStrictEqual(result[0].data.schemaUri, [
                'file:///sharedSchema.json',
                'file:///default_schema_id.yaml',
            ]);
        }));
        it('should combine types in "Incorrect type error"', () => __awaiter(void 0, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const schema = require(path.join(__dirname, './fixtures/testMultipleSimilarSchema.json'));
            languageService.addSchema(sharedSchemaId, schema.sharedSchema);
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema.schema);
            const content = 'test_anyOf_objects:\n  propA:';
            const result = yield parseSetup(content);
            assert.strictEqual(result.length, 3);
            assert.strictEqual(result[2].message, 'Incorrect type. Expected "string".');
            assert.strictEqual(result[2].source, 'yaml-schema: file:///sharedSchema.json | file:///default_schema_id.yaml');
        }));
        it('should combine const value', () => __awaiter(void 0, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const schema = require(path.join(__dirname, './fixtures/testMultipleSimilarSchema.json'));
            languageService.addSchema(sharedSchemaId, schema.sharedSchema);
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema.schema);
            const content = 'test_anyOf_objects:\n  constA:';
            const result = yield parseSetup(content);
            assert.strictEqual(result.length, 4);
            assert.strictEqual(result[3].message, 'Value must be "constForType1" | "constForType3".');
            assert.strictEqual(result[3].source, 'yaml-schema: file:///sharedSchema.json | file:///default_schema_id.yaml');
        }));
        it('should distinguish types in error: "Missing property from multiple schemas"', () => __awaiter(void 0, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const schema = require(path.join(__dirname, './fixtures/testMultipleSimilarSchema.json'));
            languageService.addSchema(sharedSchemaId, schema.sharedSchema);
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema.schema);
            const content = 'test_anyOf_objects:\n  someProp:';
            const result = yield parseSetup(content);
            assert.strictEqual(result.length, 3);
            assert.strictEqual(result[0].message, 'Missing property "objA".');
            assert.strictEqual(result[0].source, 'yaml-schema: file:///sharedSchema.json | file:///default_schema_id.yaml');
            assert.deepStrictEqual(result[0].data.schemaUri, [
                'file:///sharedSchema.json',
                'file:///default_schema_id.yaml',
            ]);
            assert.strictEqual(result[1].message, 'Missing property "propA".');
            assert.strictEqual(result[1].source, 'yaml-schema: file:///sharedSchema.json | file:///default_schema_id.yaml');
            assert.deepStrictEqual(result[1].data.schemaUri, [
                'file:///sharedSchema.json',
                'file:///default_schema_id.yaml',
            ]);
            assert.strictEqual(result[2].message, 'Missing property "constA".');
            assert.strictEqual(result[2].source, 'yaml-schema: file:///sharedSchema.json | file:///default_schema_id.yaml');
            assert.deepStrictEqual(result[2].data.schemaUri, [
                'file:///sharedSchema.json',
                'file:///default_schema_id.yaml',
            ]);
        }));
    });
    describe('Empty document validation', () => {
        it('should provide validation for empty document', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    scripts: {
                        type: 'string',
                    },
                },
                required: ['scripts'],
            });
            const content = '';
            const result = yield parseSetup(content);
            assert.strictEqual(result.length, 1);
            assert.deepStrictEqual(result[0], verifyError_1.createDiagnosticWithData(errorMessages_1.MissingRequiredPropWarning.replace('{0}', 'scripts'), 0, 0, 0, 0, vscode_languageserver_1.DiagnosticSeverity.Error, `yaml-schema: file:///${testHelper_1.SCHEMA_ID}`, `file:///${testHelper_1.SCHEMA_ID}`));
        }));
        it('should provide validation for document which contains only whitespaces', () => __awaiter(void 0, void 0, void 0, function* () {
            languageService.addSchema(testHelper_1.SCHEMA_ID, {
                type: 'object',
                properties: {
                    scripts: {
                        type: 'string',
                    },
                },
                required: ['scripts'],
            });
            const content = '  \n   \n';
            const result = yield parseSetup(content);
            assert.deepStrictEqual(result[0], verifyError_1.createDiagnosticWithData(errorMessages_1.MissingRequiredPropWarning.replace('{0}', 'scripts'), 0, 0, 0, 1, vscode_languageserver_1.DiagnosticSeverity.Error, `yaml-schema: file:///${testHelper_1.SCHEMA_ID}`, `file:///${testHelper_1.SCHEMA_ID}`));
        }));
    });
    describe('Additional properties validation', () => {
        it('should allow additional props on object by default', () => __awaiter(void 0, void 0, void 0, function* () {
            const schema = {
                type: 'object',
                properties: {
                    prop1: {
                        type: 'string',
                    },
                },
            };
            languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
            const content = `prop2: you could be there 'prop2'`;
            const result = yield parseSetup(content);
            chai_1.expect(result.length).to.eq(0);
        }));
        describe('Additional properties validation with enabled disableAdditionalProperties', () => {
            before(() => {
                languageSettingsSetup.languageSettings.disableAdditionalProperties = true;
                languageService.configure(languageSettingsSetup.languageSettings);
            });
            after(() => {
                languageSettingsSetup.languageSettings.disableAdditionalProperties = false;
            });
            it('should return additional prop error when there is extra prop', () => __awaiter(void 0, void 0, void 0, function* () {
                const schema = {
                    type: 'object',
                    properties: {
                        prop1: {
                            type: 'string',
                        },
                    },
                };
                languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
                const content = `prop2: you should not be there 'prop2'`;
                const result = yield parseSetup(content);
                chai_1.expect(result.length).to.eq(1);
                chai_1.expect(result[0].message).to.eq('Property prop2 is not allowed.');
            }));
            it('should allow additional props on object when additionalProp is true on object', () => __awaiter(void 0, void 0, void 0, function* () {
                const schema = {
                    type: 'object',
                    properties: {
                        prop1: {
                            type: 'string',
                        },
                    },
                    additionalProperties: true,
                };
                languageService.addSchema(testHelper_1.SCHEMA_ID, schema);
                const content = `prop2: you could be there 'prop2'`;
                const result = yield parseSetup(content);
                chai_1.expect(result.length).to.eq(0);
            }));
        });
    });
});
//# sourceMappingURL=schemaValidation.test.js.map