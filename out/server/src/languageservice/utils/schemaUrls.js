"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSchemaURI = exports.JSON_SCHEMASTORE_URL = exports.KUBERNETES_SCHEMA_URL = void 0;
const paths_1 = require("./paths");
exports.KUBERNETES_SCHEMA_URL = 'https://raw.githubusercontent.com/yannh/kubernetes-json-schema/master/v1.20.5-standalone-strict/all.json';
exports.JSON_SCHEMASTORE_URL = 'https://www.schemastore.org/api/json/catalog.json';
function checkSchemaURI(workspaceFolders, workspaceRoot, uri, telemetry) {
    if (uri.trim().toLowerCase() === 'kubernetes') {
        telemetry.send({ name: 'yaml.schema.configured', properties: { kubernetes: true } });
        return exports.KUBERNETES_SCHEMA_URL;
    }
    else if (paths_1.isRelativePath(uri)) {
        return paths_1.relativeToAbsolutePath(workspaceFolders, workspaceRoot, uri);
    }
    else {
        return uri;
    }
}
exports.checkSchemaURI = checkSchemaURI;
//# sourceMappingURL=schemaUrls.js.map