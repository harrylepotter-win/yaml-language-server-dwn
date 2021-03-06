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
const schemaRequestHandler_1 = require("../src/languageservice/services/schemaRequestHandler");
const sinon = require("sinon");
const fs = require("fs");
const vscode_uri_1 = require("vscode-uri");
const chai = require("chai");
const sinonChai = require("sinon-chai");
const expect = chai.expect;
chai.use(sinonChai);
describe('Schema Request Handler Tests', () => {
    describe('schemaRequestHandler', () => {
        const sandbox = sinon.createSandbox();
        let readFileStub;
        beforeEach(() => {
            readFileStub = sandbox.stub(fs, 'readFile');
        });
        afterEach(() => {
            sandbox.restore();
        });
        it('Should care Win URI', () => __awaiter(void 0, void 0, void 0, function* () {
            const connection = {};
            const resultPromise = schemaRequestHandler_1.schemaRequestHandler(connection, 'c:\\some\\window\\path\\scheme.json', [], vscode_uri_1.URI.parse(''), false);
            expect(readFileStub).calledOnceWith('c:\\some\\window\\path\\scheme.json');
            readFileStub.callArgWith(2, undefined, '{some: "json"}');
            const result = yield resultPromise;
            expect(result).to.be.equal('{some: "json"}');
        }));
        it('UNIX URI should works', () => __awaiter(void 0, void 0, void 0, function* () {
            const connection = {};
            const resultPromise = schemaRequestHandler_1.schemaRequestHandler(connection, '/some/unix/path/', [], vscode_uri_1.URI.parse(''), false);
            readFileStub.callArgWith(2, undefined, '{some: "json"}');
            const result = yield resultPromise;
            expect(result).to.be.equal('{some: "json"}');
        }));
        it('should handle not valid Windows path', () => __awaiter(void 0, void 0, void 0, function* () {
            const connection = {};
            const resultPromise = schemaRequestHandler_1.schemaRequestHandler(connection, 'A:/some/window/path/scheme.json', [], vscode_uri_1.URI.parse(''), false);
            expect(readFileStub).calledOnceWith(vscode_uri_1.URI.file('a:/some/window/path/scheme.json').fsPath);
            readFileStub.callArgWith(2, undefined, '{some: "json"}');
            const result = yield resultPromise;
            expect(result).to.be.equal('{some: "json"}');
        }));
    });
});
//# sourceMappingURL=schemaRequestHandler.test.js.map