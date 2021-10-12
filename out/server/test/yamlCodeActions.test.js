"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const chai = require("chai");
const yamlCodeActions_1 = require("../src/languageservice/services/yamlCodeActions");
const vscode_languageserver_1 = require("vscode-languageserver");
const testHelper_1 = require("./utils/testHelper");
const verifyError_1 = require("./utils/verifyError");
const commands_1 = require("../src/commands");
const expect = chai.expect;
chai.use(sinonChai);
const JSON_SCHEMA_LOCAL = 'file://some/path/schema.json';
const JSON_SCHEMA2_LOCAL = 'file://some/path/schema2.json';
describe('CodeActions Tests', () => {
    const sandbox = sinon.createSandbox();
    let clientCapabilities;
    beforeEach(() => {
        clientCapabilities = {};
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe('JumpToSchema tests', () => {
        it('should not provide any actions if there are no diagnostics', () => {
            const doc = testHelper_1.setupTextDocument('');
            const params = {
                context: vscode_languageserver_1.CodeActionContext.create(undefined),
                range: undefined,
                textDocument: vscode_languageserver_1.TextDocumentIdentifier.create(testHelper_1.TEST_URI),
            };
            const actions = new yamlCodeActions_1.YamlCodeActions(clientCapabilities);
            const result = actions.getCodeAction(doc, params);
            expect(result).to.be.undefined;
        });
        it('should provide action if diagnostic has uri for schema', () => {
            const doc = testHelper_1.setupTextDocument('');
            const diagnostics = [verifyError_1.createDiagnosticWithData('foo', 0, 0, 0, 0, 1, JSON_SCHEMA_LOCAL, JSON_SCHEMA_LOCAL)];
            const params = {
                context: vscode_languageserver_1.CodeActionContext.create(diagnostics),
                range: undefined,
                textDocument: vscode_languageserver_1.TextDocumentIdentifier.create(testHelper_1.TEST_URI),
            };
            clientCapabilities.window = { showDocument: { support: true } };
            const actions = new yamlCodeActions_1.YamlCodeActions(clientCapabilities);
            const result = actions.getCodeAction(doc, params);
            const codeAction = vscode_languageserver_1.CodeAction.create('Jump to schema location (schema.json)', vscode_languageserver_1.Command.create('JumpToSchema', commands_1.YamlCommands.JUMP_TO_SCHEMA, JSON_SCHEMA_LOCAL));
            codeAction.diagnostics = diagnostics;
            expect(result[0]).to.deep.equal(codeAction);
        });
        it('should provide multiple action if diagnostic has uri for multiple schemas', () => {
            const doc = testHelper_1.setupTextDocument('');
            const diagnostics = [
                verifyError_1.createDiagnosticWithData('foo', 0, 0, 0, 0, 1, JSON_SCHEMA_LOCAL, [JSON_SCHEMA_LOCAL, JSON_SCHEMA2_LOCAL]),
            ];
            const params = {
                context: vscode_languageserver_1.CodeActionContext.create(diagnostics),
                range: undefined,
                textDocument: vscode_languageserver_1.TextDocumentIdentifier.create(testHelper_1.TEST_URI),
            };
            clientCapabilities.window = { showDocument: { support: true } };
            const actions = new yamlCodeActions_1.YamlCodeActions(clientCapabilities);
            const result = actions.getCodeAction(doc, params);
            const codeAction = vscode_languageserver_1.CodeAction.create('Jump to schema location (schema.json)', vscode_languageserver_1.Command.create('JumpToSchema', commands_1.YamlCommands.JUMP_TO_SCHEMA, JSON_SCHEMA_LOCAL));
            const codeAction2 = vscode_languageserver_1.CodeAction.create('Jump to schema location (schema2.json)', vscode_languageserver_1.Command.create('JumpToSchema', commands_1.YamlCommands.JUMP_TO_SCHEMA, JSON_SCHEMA2_LOCAL));
            codeAction.diagnostics = diagnostics;
            codeAction2.diagnostics = diagnostics;
            expect(result[0]).to.deep.equal(codeAction);
            expect(result[1]).to.deep.equal(codeAction2);
        });
    });
    describe('Convert TAB to Spaces', () => {
        it('should add "Convert TAB to Spaces" CodeAction', () => {
            const doc = testHelper_1.setupTextDocument('foo:\n\t- bar');
            const diagnostics = [verifyError_1.createExpectedError('Using tabs can lead to unpredictable results', 1, 0, 1, 1, 1, JSON_SCHEMA_LOCAL)];
            const params = {
                context: vscode_languageserver_1.CodeActionContext.create(diagnostics),
                range: undefined,
                textDocument: vscode_languageserver_1.TextDocumentIdentifier.create(testHelper_1.TEST_URI),
            };
            const actions = new yamlCodeActions_1.YamlCodeActions(clientCapabilities);
            const result = actions.getCodeAction(doc, params);
            expect(result).to.has.length(2);
            expect(result[0].title).to.be.equal('Convert Tab to Spaces');
            expect(vscode_languageserver_1.WorkspaceEdit.is(result[0].edit)).to.be.true;
            expect(result[0].edit.changes[testHelper_1.TEST_URI]).deep.equal([vscode_languageserver_1.TextEdit.replace(vscode_languageserver_1.Range.create(1, 0, 1, 1), '  ')]);
        });
        it('should support current indentation chars settings', () => {
            const doc = testHelper_1.setupTextDocument('foo:\n\t- bar');
            const diagnostics = [verifyError_1.createExpectedError('Using tabs can lead to unpredictable results', 1, 0, 1, 1, 1, JSON_SCHEMA_LOCAL)];
            const params = {
                context: vscode_languageserver_1.CodeActionContext.create(diagnostics),
                range: undefined,
                textDocument: vscode_languageserver_1.TextDocumentIdentifier.create(testHelper_1.TEST_URI),
            };
            const actions = new yamlCodeActions_1.YamlCodeActions(clientCapabilities);
            actions.configure({ indentation: '   ' });
            const result = actions.getCodeAction(doc, params);
            expect(result[0].title).to.be.equal('Convert Tab to Spaces');
            expect(result[0].edit.changes[testHelper_1.TEST_URI]).deep.equal([vscode_languageserver_1.TextEdit.replace(vscode_languageserver_1.Range.create(1, 0, 1, 1), '   ')]);
        });
        it('should provide "Convert all Tabs to Spaces"', () => {
            const doc = testHelper_1.setupTextDocument('foo:\n\t\t\t- bar\n\t\t');
            const diagnostics = [verifyError_1.createExpectedError('Using tabs can lead to unpredictable results', 1, 0, 1, 3, 1, JSON_SCHEMA_LOCAL)];
            const params = {
                context: vscode_languageserver_1.CodeActionContext.create(diagnostics),
                range: undefined,
                textDocument: vscode_languageserver_1.TextDocumentIdentifier.create(testHelper_1.TEST_URI),
            };
            const actions = new yamlCodeActions_1.YamlCodeActions(clientCapabilities);
            const result = actions.getCodeAction(doc, params);
            expect(result[1].title).to.be.equal('Convert all Tabs to Spaces');
            expect(result[1].edit.changes[testHelper_1.TEST_URI]).deep.equal([
                vscode_languageserver_1.TextEdit.replace(vscode_languageserver_1.Range.create(1, 0, 1, 3), '      '),
                vscode_languageserver_1.TextEdit.replace(vscode_languageserver_1.Range.create(2, 0, 2, 2), '    '),
            ]);
        });
    });
});
//# sourceMappingURL=yamlCodeActions.test.js.map