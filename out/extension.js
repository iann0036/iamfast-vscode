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
exports.activate = void 0;
const vscode_1 = require("vscode");
const provider_1 = require("./provider");
function activate(context) {
    const provider = new provider_1.default();
    const providerRegistrations = vscode_1.Disposable.from(vscode_1.workspace.registerTextDocumentContentProvider(provider_1.default.scheme, provider));
    const commandRegistration = vscode_1.commands.registerTextEditorCommand('iamfast.showIAMPolicy', (editor) => __awaiter(this, void 0, void 0, function* () {
        const uri = provider_1.encodeLocation(editor.document.uri);
        const doc = yield vscode_1.workspace.openTextDocument(uri);
        vscode_1.languages.setTextDocumentLanguage(doc, 'json');
        return yield vscode_1.window.showTextDocument(doc, (editor.viewColumn) + 1, true);
    }));
    context.subscriptions.push(provider, commandRegistration, providerRegistrations);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map