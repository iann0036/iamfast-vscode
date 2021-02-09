import * as vscode from 'vscode';

export default class Provider implements vscode.TextDocumentContentProvider {

	static scheme = 'iamfast';

	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	private _subscriptions: vscode.Disposable;

	constructor() {
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

	provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {
		const target = decodeLocation(uri).fsPath;
		
        return `{"fspath": "${target.toString()}"}`;
	}
}

export function encodeLocation(uri: vscode.Uri): vscode.Uri {
	const fromdoc = encodeURIComponent(uri.toString());
	return vscode.Uri.parse(`${Provider.scheme}:IAM Policy?${fromdoc}`);
}

export function decodeLocation(uri: vscode.Uri): vscode.Uri {
	const fromdoc = decodeURIComponent(uri.query);
	return vscode.Uri.parse(fromdoc);
}