"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeLocation = exports.encodeLocation = void 0;
const vscode = require("vscode");
class Provider {
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
        this._subscriptions = vscode.workspace.onDidCloseTextDocument(doc => {
            console.log(doc.uri.toString());
        });
    }
    dispose() {
        this._subscriptions.dispose();
        this._onDidChange.dispose();
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    provideTextDocumentContent(uri) {
        const target = decodeLocation(uri).fsPath;
        return `{"fspath": "${target.toString()}"}`;
    }
}
exports.default = Provider;
Provider.scheme = 'iamfast';
function encodeLocation(uri) {
    const fromdoc = encodeURIComponent(uri.toString());
    return vscode.Uri.parse(`${Provider.scheme}:IAM Policy?${fromdoc}`);
}
exports.encodeLocation = encodeLocation;
function decodeLocation(uri) {
    const fromdoc = decodeURIComponent(uri.query);
    return vscode.Uri.parse(fromdoc);
}
exports.decodeLocation = decodeLocation;
//# sourceMappingURL=provider.js.map