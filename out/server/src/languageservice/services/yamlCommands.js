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
exports.registerCommands = void 0;
const commands_1 = require("../../commands");
const vscode_uri_1 = require("vscode-uri");
function registerCommands(commandExecutor, connection) {
    commandExecutor.registerCommand(commands_1.YamlCommands.JUMP_TO_SCHEMA, (uri) => __awaiter(this, void 0, void 0, function* () {
        if (!uri) {
            return;
        }
        // if uri points to local file of its a windows path
        if (!uri.startsWith('file') && !/^[a-z]:[\\/]/i.test(uri)) {
            const origUri = vscode_uri_1.URI.parse(uri);
            const customUri = vscode_uri_1.URI.from({
                scheme: 'json-schema',
                authority: origUri.authority,
                path: origUri.path.endsWith('.json') ? origUri.path : origUri.path + '.json',
                fragment: uri,
            });
            uri = customUri.toString();
        }
        // test if uri is windows path, ie starts with 'c:\' and convert to URI
        if (/^[a-z]:[\\/]/i.test(uri)) {
            const winUri = vscode_uri_1.URI.file(uri);
            uri = winUri.toString();
        }
        const result = yield connection.window.showDocument({ uri: uri, external: false, takeFocus: true });
        if (!result) {
            connection.window.showErrorMessage(`Cannot open ${uri}`);
        }
    }));
}
exports.registerCommands = registerCommands;
//# sourceMappingURL=yamlCommands.js.map