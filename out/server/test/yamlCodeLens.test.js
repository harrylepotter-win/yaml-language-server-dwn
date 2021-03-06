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
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chai = require("chai");
const yamlCodeLens_1 = require("../src/languageservice/services/yamlCodeLens");
const yamlSchemaService_1 = require("../src/languageservice/services/yamlSchemaService");
const testHelper_1 = require("./utils/testHelper");
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const commands_1 = require("../src/commands");
const telemetry_1 = require("../src/languageserver/telemetry");
const expect = chai.expect;
chai.use(sinonChai);
describe('YAML CodeLens', () => {
    const sandbox = sinon.createSandbox();
    let yamlSchemaService;
    let telemetryStub;
    let telemetry;
    beforeEach(() => {
        yamlSchemaService = sandbox.createStubInstance(yamlSchemaService_1.YAMLSchemaService);
        telemetryStub = sandbox.createStubInstance(telemetry_1.Telemetry);
        telemetry = telemetryStub;
    });
    afterEach(() => {
        sandbox.restore();
    });
    function createCommand(title, arg) {
        return {
            title,
            command: commands_1.YamlCommands.JUMP_TO_SCHEMA,
            arguments: [arg],
        };
    }
    function createCodeLens(title, arg) {
        const lens = vscode_languageserver_protocol_1.CodeLens.create(vscode_languageserver_protocol_1.Range.create(0, 0, 0, 0));
        lens.command = createCommand(title, arg);
        return lens;
    }
    it('should provides CodeLens with jumpToSchema command', () => __awaiter(void 0, void 0, void 0, function* () {
        const doc = testHelper_1.setupTextDocument('foo: bar');
        const schema = {
            url: 'some://url/to/schema.json',
        };
        yamlSchemaService.getSchemaForResource.resolves({ schema });
        const codeLens = new yamlCodeLens_1.YamlCodeLens(yamlSchemaService, telemetry);
        const result = yield codeLens.getCodeLens(doc, { textDocument: { uri: doc.uri } });
        expect(result).is.not.empty;
        expect(result[0].command).is.not.undefined;
        expect(result[0].command).is.deep.equal(createCommand('schema.json', 'some://url/to/schema.json'));
    }));
    it('should place CodeLens at beginning of the file and it has command', () => __awaiter(void 0, void 0, void 0, function* () {
        const doc = testHelper_1.setupTextDocument('foo: bar');
        const schema = {
            url: 'some://url/to/schema.json',
        };
        yamlSchemaService.getSchemaForResource.resolves({ schema });
        const codeLens = new yamlCodeLens_1.YamlCodeLens(yamlSchemaService, telemetry);
        const result = yield codeLens.getCodeLens(doc, { textDocument: { uri: doc.uri } });
        expect(result[0].range).is.deep.equal(vscode_languageserver_protocol_1.Range.create(0, 0, 0, 0));
        expect(result[0].command).is.deep.equal(createCommand('schema.json', 'some://url/to/schema.json'));
    }));
    it('command name should contains schema title', () => __awaiter(void 0, void 0, void 0, function* () {
        const doc = testHelper_1.setupTextDocument('foo: bar');
        const schema = {
            url: 'some://url/to/schema.json',
            title: 'fooBar',
        };
        yamlSchemaService.getSchemaForResource.resolves({ schema });
        const codeLens = new yamlCodeLens_1.YamlCodeLens(yamlSchemaService, telemetry);
        const result = yield codeLens.getCodeLens(doc, { textDocument: { uri: doc.uri } });
        expect(result[0].command).is.deep.equal(createCommand('fooBar (schema.json)', 'some://url/to/schema.json'));
    }));
    it('should provide lens for oneOf schemas', () => __awaiter(void 0, void 0, void 0, function* () {
        const doc = testHelper_1.setupTextDocument('foo: bar');
        const schema = {
            oneOf: [
                {
                    url: 'some://url/schema1.json',
                },
                {
                    url: 'some://url/schema2.json',
                },
            ],
        };
        yamlSchemaService.getSchemaForResource.resolves({ schema });
        const codeLens = new yamlCodeLens_1.YamlCodeLens(yamlSchemaService, telemetry);
        const result = yield codeLens.getCodeLens(doc, { textDocument: { uri: doc.uri } });
        expect(result).has.length(2);
        expect(result).is.deep.equal([
            createCodeLens('schema1.json', 'some://url/schema1.json'),
            createCodeLens('schema2.json', 'some://url/schema2.json'),
        ]);
    }));
    it('should provide lens for allOf schemas', () => __awaiter(void 0, void 0, void 0, function* () {
        const doc = testHelper_1.setupTextDocument('foo: bar');
        const schema = {
            allOf: [
                {
                    url: 'some://url/schema1.json',
                },
                {
                    url: 'some://url/schema2.json',
                },
            ],
        };
        yamlSchemaService.getSchemaForResource.resolves({ schema });
        const codeLens = new yamlCodeLens_1.YamlCodeLens(yamlSchemaService, telemetry);
        const result = yield codeLens.getCodeLens(doc, { textDocument: { uri: doc.uri } });
        expect(result).has.length(2);
        expect(result).is.deep.equal([
            createCodeLens('schema1.json', 'some://url/schema1.json'),
            createCodeLens('schema2.json', 'some://url/schema2.json'),
        ]);
    }));
    it('should provide lens for anyOf schemas', () => __awaiter(void 0, void 0, void 0, function* () {
        const doc = testHelper_1.setupTextDocument('foo: bar');
        const schema = {
            anyOf: [
                {
                    url: 'some://url/schema1.json',
                },
                {
                    url: 'some://url/schema2.json',
                },
            ],
        };
        yamlSchemaService.getSchemaForResource.resolves({ schema });
        const codeLens = new yamlCodeLens_1.YamlCodeLens(yamlSchemaService, telemetry);
        const result = yield codeLens.getCodeLens(doc, { textDocument: { uri: doc.uri } });
        expect(result).has.length(2);
        expect(result).is.deep.equal([
            createCodeLens('schema1.json', 'some://url/schema1.json'),
            createCodeLens('schema2.json', 'some://url/schema2.json'),
        ]);
    }));
});
//# sourceMappingURL=yamlCodeLens.test.js.map