/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Adam Voss. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const nls = require("vscode-nls");
const schemaRequestHandler_1 = require("./languageservice/services/schemaRequestHandler");
const yamlServerInit_1 = require("./yamlServerInit");
const yamlSettings_1 = require("./yamlSettings");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
nls.config(process.env['VSCODE_NLS_CONFIG']);
// Create a connection for the server.
let connection = null;
if (process.argv.indexOf('--stdio') === -1) {
    connection = node_1.createConnection(node_1.ProposedFeatures.all);
}
else {
    connection = node_1.createConnection();
}
console.log = connection.console.log.bind(connection.console);
console.error = connection.console.error.bind(connection.console);
//vscode-nls calls console.error(null) in some cases, so we put that in info, to predict sending "null" in to telemetry
console.error = (arg) => {
    if (arg === null) {
        connection.console.info(arg);
    }
    else {
        connection.console.error(arg);
    }
};
const yamlSettings = new yamlSettings_1.SettingsState();
/**
 * Handles schema content requests given the schema URI
 * @param uri can be a local file, vscode request, http(s) request or a custom request
 */
const schemaRequestHandlerWrapper = (connection, uri) => {
    return schemaRequestHandler_1.schemaRequestHandler(connection, uri, yamlSettings.workspaceFolders, yamlSettings.workspaceRoot, yamlSettings.useVSCodeContentRequest);
};
const schemaRequestService = schemaRequestHandlerWrapper.bind(this, connection);
new yamlServerInit_1.YAMLServerInit(connection, yamlSettings, schemaRequestHandler_1.workspaceContext, schemaRequestService).start();
//# sourceMappingURL=server.js.map