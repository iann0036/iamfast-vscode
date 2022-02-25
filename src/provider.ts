import * as vscode from 'vscode';
import * as fs from 'fs';
// @ts-ignore
import { IAMFast } from 'iamfast';
import IAMFastReferenceProvider from './referenceprovider';

export default class Provider implements vscode.TextDocumentContentProvider {

	static scheme = 'iamfast';


	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	private _subscriptions: vscode.Disposable;
	private iamfast: any;
	private referenceProvider: IAMFastReferenceProvider;

	constructor(referenceProvider: IAMFastReferenceProvider) {
		this._subscriptions = vscode.workspace.onDidCloseTextDocument(doc => {
            console.log(doc.uri.toString());
        });
		this.iamfast = new IAMFast.default();
		this.referenceProvider = referenceProvider;
	}

	dispose() {
		this._subscriptions.dispose();
		this._onDidChange.dispose();
	}

	get onDidChange() {
		return this._onDidChange.event;
	}

	provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {
		return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating IAM policy",
            cancellable: false
        }, async (progress, token) => {
			const targetUri = decodeLocation(uri);
            const target = targetUri.fsPath;

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

			try {
				let output = this.iamfast.GenerateIAMPolicy(code, language);

				this.referenceProvider.set(targetUri, this.iamfast.last_privs);

				return output;
			} catch (e) {}

			return "Could not generate the IAM policy";
        });
	}
}

export function encodeLocation(uri: vscode.Uri): vscode.Uri {
	const fromdoc = encodeURIComponent(uri.toString());
	const randomstr = (Math.random() + 1).toString(36).substring(2);
	return vscode.Uri.parse(`${Provider.scheme}:IAM Policy?${fromdoc}#${randomstr}`);
}

export function decodeLocation(uri: vscode.Uri): vscode.Uri {
	const fromdoc = decodeURIComponent(uri.query.split("#")[0]);
	return vscode.Uri.parse(fromdoc);
}