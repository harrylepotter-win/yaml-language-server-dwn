"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
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
const settingsHandlers_1 = require("../src/languageserver/handlers/settingsHandlers");
const sinon = require("sinon");
const chai = require("chai");
const sinonChai = require("sinon-chai");
const yamlSettings_1 = require("../src/yamlSettings");
const validationHandlers_1 = require("../src/languageserver/handlers/validationHandlers");
const src_1 = require("../src");
const request = require("request-light");
const testHelper_1 = require("./utils/testHelper");
const testsTypes_1 = require("./utils/testsTypes");
const expect = chai.expect;
chai.use(sinonChai);
describe('Settings Handlers Tests', () => {
    const sandbox = sinon.createSandbox();
    const connection = {};
    let workspaceStub;
    let languageService;
    let settingsState;
    let validationHandler;
    let xhrStub;
    beforeEach(() => {
        workspaceStub = sandbox.createStubInstance(testsTypes_1.TestWorkspace);
        connection.workspace = workspaceStub;
        connection.onDidChangeConfiguration = sandbox.mock();
        connection.client = {};
        connection.client.register = sandbox.mock();
        languageService = sandbox.mock();
        settingsState = new yamlSettings_1.SettingsState();
        validationHandler = sandbox.mock(validationHandlers_1.ValidationHandler);
        xhrStub = sandbox.stub(request, 'xhr');
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('should not register configuration notification handler if client not supports dynamic handlers', () => {
        settingsState.clientDynamicRegisterSupport = false;
        settingsState.hasConfigurationCapability = false;
        const settingsHandler = new settingsHandlers_1.SettingsHandler(connection, languageService, settingsState, validationHandler, {});
        settingsHandler.registerHandlers();
        expect(connection.client.register).not.called;
    });
    it('should register configuration notification handler only if client supports dynamic handlers', () => {
        settingsState.clientDynamicRegisterSupport = true;
        settingsState.hasConfigurationCapability = true;
        const settingsHandler = new settingsHandlers_1.SettingsHandler(connection, languageService, settingsState, validationHandler, {});
        settingsHandler.registerHandlers();
        expect(connection.client.register).calledOnce;
    });
    it('SettingsHandler should not modify file match patterns', () => __awaiter(void 0, void 0, void 0, function* () {
        xhrStub.resolves({
            responseText: `{"schemas": [
      {
        "name": ".adonisrc.json",
        "description": "AdonisJS configuration file",
        "fileMatch": [
          ".adonisrc.yaml"
        ],
        "url": "https://raw.githubusercontent.com/adonisjs/application/master/adonisrc.schema.json"
      }]}`,
        });
        const settingsHandler = new settingsHandlers_1.SettingsHandler(connection, languageService, settingsState, validationHandler, {});
        sandbox.stub(settingsHandler, 'updateConfiguration').returns();
        yield settingsHandler.setSchemaStoreSettingsIfNotSet();
        expect(settingsState.schemaStoreSettings).deep.include({
            uri: 'https://raw.githubusercontent.com/adonisjs/application/master/adonisrc.schema.json',
            fileMatch: ['.adonisrc.yaml'],
            priority: src_1.SchemaPriority.SchemaStore,
        });
    }));
    describe('Test that schema priorities are available', () => {
        const testSchemaFileMatch = ['foo/*.yml'];
        const testSchemaURI = 'file://foo.json';
        function configureSchemaPriorityTest() {
            const languageServerSetup = testHelper_1.setupLanguageService({});
            const languageService = languageServerSetup.languageService;
            const settingsHandler = new settingsHandlers_1.SettingsHandler(connection, languageService, settingsState, validationHandler, {});
            const configureSpy = sinon.spy(languageService, 'configure');
            settingsHandler.updateConfiguration();
            // Check things here
            configureSpy.restore();
            return configureSpy.args[0][0];
        }
        it('Schema Settings should have a priority', () => __awaiter(void 0, void 0, void 0, function* () {
            settingsState.schemaConfigurationSettings = [
                {
                    fileMatch: testSchemaFileMatch,
                    uri: testSchemaURI,
                },
            ];
            const configureSpy = configureSchemaPriorityTest();
            expect(configureSpy.schemas).deep.include({
                uri: testSchemaURI,
                fileMatch: testSchemaFileMatch,
                schema: undefined,
                priority: src_1.SchemaPriority.Settings,
            });
        }));
        it('Schema Associations should have a priority when schema association is an array', () => __awaiter(void 0, void 0, void 0, function* () {
            settingsState.schemaAssociations = [
                {
                    fileMatch: testSchemaFileMatch,
                    uri: testSchemaURI,
                },
            ];
            const configureSpy = configureSchemaPriorityTest();
            expect(configureSpy.schemas).deep.include({
                uri: testSchemaURI,
                fileMatch: testSchemaFileMatch,
                schema: undefined,
                priority: src_1.SchemaPriority.SchemaAssociation,
            });
        }));
        it('Schema Associations should have a priority when schema association is a record', () => __awaiter(void 0, void 0, void 0, function* () {
            settingsState.schemaAssociations = {
                [testSchemaURI]: testSchemaFileMatch,
            };
            const configureSpy = configureSchemaPriorityTest();
            expect(configureSpy.schemas).deep.include({
                uri: testSchemaURI,
                fileMatch: testSchemaFileMatch,
                priority: src_1.SchemaPriority.SchemaAssociation,
            });
        }));
    });
    describe('Settings fetch', () => {
        it('should fetch preferences', () => __awaiter(void 0, void 0, void 0, function* () {
            const settingsHandler = new settingsHandlers_1.SettingsHandler(connection, languageService, settingsState, validationHandler, {});
            workspaceStub.getConfiguration.resolves([{}, {}, {}]);
            const setConfigurationStub = sandbox.stub(settingsHandler, 'setConfiguration');
            yield settingsHandler.pullConfiguration();
            expect(workspaceStub.getConfiguration).calledOnceWith([{ section: 'yaml' }, { section: 'http' }, { section: '[yaml]' }]);
            expect(setConfigurationStub).calledOnceWith({
                yaml: {},
                http: {
                    proxy: '',
                    proxyStrictSSL: false,
                },
                yamlEditor: {},
            });
        }));
    });
});
//# sourceMappingURL=settingsHandlers.test.js.map