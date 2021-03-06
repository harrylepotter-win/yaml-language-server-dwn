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
const sinon = require("sinon");
const chai = require("chai");
const sinonChai = require("sinon-chai");
const SchemaService = require("../src/languageservice/services/yamlSchemaService");
const yamlParser07_1 = require("../src/languageservice/parser/yamlParser07");
const expect = chai.expect;
chai.use(sinonChai);
describe('YAML Schema Service', () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => {
        sandbox.restore();
    });
    describe('Schema for resource', () => {
        let requestServiceMock;
        beforeEach(() => {
            requestServiceMock = sandbox.fake.resolves(undefined);
        });
        it('should handle inline schema http url', () => {
            const documentContent = `# yaml-language-server: $schema=http://json-schema.org/draft-07/schema# anothermodeline=value\n`;
            const content = `${documentContent}\n---\n- `;
            const yamlDock = yamlParser07_1.parse(content);
            const service = new SchemaService.YAMLSchemaService(requestServiceMock);
            service.getSchemaForResource('', yamlDock.documents[0]);
            expect(requestServiceMock).calledOnceWith('http://json-schema.org/draft-07/schema#');
        });
        it('should handle inline schema https url', () => {
            const documentContent = `# yaml-language-server: $schema=https://json-schema.org/draft-07/schema# anothermodeline=value\n`;
            const content = `${documentContent}\n---\n- `;
            const yamlDock = yamlParser07_1.parse(content);
            const service = new SchemaService.YAMLSchemaService(requestServiceMock);
            service.getSchemaForResource('', yamlDock.documents[0]);
            expect(requestServiceMock).calledOnceWith('https://json-schema.org/draft-07/schema#');
        });
        it('should handle url with fragments', () => __awaiter(void 0, void 0, void 0, function* () {
            const content = `# yaml-language-server: $schema=https://json-schema.org/draft-07/schema#/definitions/schemaArray`;
            const yamlDock = yamlParser07_1.parse(content);
            requestServiceMock = sandbox.fake.resolves(`{"definitions": {"schemaArray": {
        "type": "array",
        "minItems": 1,
        "items": { "$ref": "#" }
    }}, "properties": {}}`);
            const service = new SchemaService.YAMLSchemaService(requestServiceMock);
            const schema = yield service.getSchemaForResource('', yamlDock.documents[0]);
            expect(requestServiceMock).calledTwice;
            expect(requestServiceMock).calledWithExactly('https://json-schema.org/draft-07/schema');
            expect(requestServiceMock).calledWithExactly('https://json-schema.org/draft-07/schema#/definitions/schemaArray');
            expect(schema.schema.type).eqls('array');
        }));
    });
});
//# sourceMappingURL=yamlSchemaService.test.js.map