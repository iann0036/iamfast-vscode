import * as vscode from 'vscode';
import * as fs from 'fs';
import { IAMFast } from 'iamfast';

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

		let language = 'unknown'; // TODO: Replace with static method
		if (target.endsWith(".js") || target.endsWith(".cjs")) {
			language = 'js';
		} else if (target.endsWith(".py")) {
			language = 'python';
		} else if (target.endsWith(".java")) {
			language = 'java';
		} else if (target.endsWith(".go")) {
			language = 'go';
		} else if (target.endsWith(".cpp") || target.endsWith(".c")) {
			language = 'cplusplus';
		}

		const code = fs.readFileSync(target, {encoding:'utf8', flag:'r'});

		const iamfastobj = new IAMFast.default();

		try {
			return iamfastobj.GenerateIAMPolicy(code, language);
		} catch (e) {}

		return "Could not generate the IAM policy";
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