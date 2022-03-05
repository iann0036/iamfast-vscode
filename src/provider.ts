import * as vscode from 'vscode';
import * as fs from 'fs';
// @ts-ignore
import { IAMFast } from 'iamfast';
import IAMFastReferenceProvider from './referenceprovider';

export default class Provider implements vscode.TextDocumentContentProvider {

	static scheme = 'iamfast';


	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	private iamfast: any;
	private referenceProvider: IAMFastReferenceProvider;

	constructor(referenceProvider: IAMFastReferenceProvider) {
		this.iamfast = new IAMFast.default();
		this.referenceProvider = referenceProvider;
	}

	dispose() {
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
			let targetUri = decodeLocation(uri);
			let targetUriType = decodeLocationType(uri);
            let target = targetUri.fsPath;
			let targetUris = [targetUri];
			let output: string = '';

			if (targetUriType === "workspace") {
				targetUris = await vscode.workspace.findFiles(new vscode.RelativePattern(target, '**/*.{js,jsx,c,cpp,go,java,py,py3}'));
			}

			for (targetUri of targetUris) {
				target = targetUri.fsPath;

				console.info("Processing " + targetUri.fsPath);

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
					output = this.iamfast.GenerateIAMPolicy(code, language);
					
					await this.referenceProvider.set(targetUri, this.iamfast.last_privs);
				} catch (e) {}
			}

			this.referenceProvider.setPolicyContent(output);

			if (output !== '') {
				return output;
			}
			
			return "Could not generate the IAM policy";
        });
	}
}

export function encodeLocation(uri: vscode.Uri, locationType: string): vscode.Uri {
	const fromdoc = encodeURIComponent(uri.toString());
	const randomstr = (Math.random() + 1).toString(36).substring(2);
	return vscode.Uri.parse(`${Provider.scheme}:IAM Policy?${fromdoc}#${locationType}#${randomstr}`);
}

export function decodeLocation(uri: vscode.Uri): vscode.Uri {
	const fromdoc = decodeURIComponent(uri.query);
	return vscode.Uri.parse(fromdoc);
}

export function decodeLocationType(uri: vscode.Uri): string {
	return uri.fragment.split("#")[0];
}