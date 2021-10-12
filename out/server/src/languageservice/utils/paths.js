"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceFoldersChanged = exports.relativeToAbsolutePath = exports.isRelativePath = void 0;
const path_1 = require("path");
const vscode_uri_1 = require("vscode-uri");
exports.isRelativePath = (path) => {
    const relativePathRegex = /^(((\.\.?)|([\w-@. ]+))(\/|\\\\?))*[\w-. ]*\.[\w-]+$/i;
    return relativePathRegex.test(path);
};
exports.relativeToAbsolutePath = (workspaceFolders, workspaceRoot, uri) => {
    // Iterate through all of the workspace root folders
    for (const folder of workspaceFolders) {
        // If the requested schema URI specifies a workspace root folder
        // Convert it into an absolute path with the appropriate root folder path
        if (uri.startsWith(folder.name)) {
            const pathToFolder = vscode_uri_1.URI.parse(folder.uri).fsPath;
            const withoutFolderPrefix = uri.split(path_1.sep);
            withoutFolderPrefix.shift();
            return vscode_uri_1.URI.file(path_1.join(pathToFolder, withoutFolderPrefix.join())).toString();
        }
    }
    // If a root folder was not specified, resolve the relative URI
    // Against the location of the workspace file instead
    if (workspaceRoot) {
        return vscode_uri_1.URI.file(path_1.join(workspaceRoot.fsPath, uri)).toString();
    }
    // Fallback in case nothing could be applied
    return path_1.normalize(uri);
};
exports.workspaceFoldersChanged = (workspaceFolders, changedFolders) => {
    workspaceFolders = workspaceFolders.filter((e) => {
        return !changedFolders.removed.some((f) => {
            return f.uri === e.uri;
        });
    });
    workspaceFolders = workspaceFolders
        .filter((e) => {
        return !changedFolders.added.some((f) => {
            return f.uri === e.uri;
        });
    })
        .concat(changedFolders.added);
    return workspaceFolders;
};
//# sourceMappingURL=paths.js.map