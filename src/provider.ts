import * as vscode from 'vscode';
import * as fs from 'fs';
// @ts-ignore
import { IAMFast } from 'iamfast';
import IAMFastReferenceProvider from './referenceprovider';
import * as path from 'path';

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
		this.iamfast.Clear();
		this.referenceProvider.clear();

		return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating IAM policy",
            cancellable: false
        }, async (progress, token) => {
			let targetUri = decodeLocation(uri);
			let targetUriType = decodeLocationType(uri);
			let targetOutputType = decodeOutputType(uri);
            let target = targetUri.fsPath;
			let targetUris = [targetUri];
			let output: string = '';

			if (targetUriType === "workspace") {
				try { // try as a package, otherwise deep walk
					let packagejsonPath = path.join(target, 'package.json');
					let packagejson = JSON.parse(fs.readFileSync(packagejsonPath, { encoding: 'utf8', flag: 'r' }));
					let resolvedImportPath = path.join(target, packagejson.main);
					targetUris = [vscode.Uri.parse("file://" + resolvedImportPath)];
				} catch(e) {
					targetUris = await vscode.workspace.findFiles(new vscode.RelativePattern(target, '**/*.{js,cjs,c,cpp,go,java,py,py3,json}'));
				}
			}

			for (targetUri of targetUris) {
				target = targetUri.fsPath;

				console.info("Processing " + targetUri.fsPath);

				let language = 'unknown'; // TODO: Replace with static method
				if (target.endsWith(".js") || target.endsWith(".cjs")) {
					language = 'js';
				} else if (target.endsWith(".py") || target.endsWith(".py3")) {
					language = 'python';
				} else if (target.endsWith(".java")) {
					language = 'java';
				} else if (target.endsWith(".go")) {
					language = 'go';
				} else if (target.endsWith(".cpp") || target.endsWith(".c")) {
					language = 'cplusplus';
				} else if (target.endsWith(".json")) {
					language = 'asl';
				}

				const code = fs.readFileSync(target, {encoding:'utf8', flag:'r'});

				try {
					if (targetOutputType === "yaml") {
						output = this.iamfast.GenerateYAMLPolicy(code, language, target);
					} else if (targetOutputType === "sam") {
						output = this.iamfast.GenerateSAMTemplate(code, language, target);
					} else if (targetOutputType === "hcl") {
						output = this.iamfast.GenerateHCLTemplate(code, language, target);
					} else {
						output = this.iamfast.GenerateIAMPolicy(code, language, target);
					}
					
					await this.referenceProvider.set(targetUri, this.iamfast.privs);
				} catch (e) {
					console.debug(e);
				}
			}

			this.referenceProvider.setPolicyContent(output, targetOutputType);

			if (output !== '') {
				return output;
			}
			
			return "Could not generate the IAM policy";
        });
	}
}

export function encodeLocation(uri: vscode.Uri, locationType: string, outputType: string): vscode.Uri {
	const fromdoc = encodeURIComponent(uri.toString());
	const randomstr = (Math.random() + 1).toString(36).substring(2);
	return vscode.Uri.parse(`${Provider.scheme}:IAM Policy?${fromdoc}::${outputType}::${locationType}::${randomstr}`);
}

export function decodeLocation(uri: vscode.Uri): vscode.Uri {
	const fromdoc = decodeURIComponent(uri.query).split("::")[0];
	return vscode.Uri.parse(fromdoc);
}

export function decodeLocationType(uri: vscode.Uri): string {
	return decodeURIComponent(uri.query).split("::")[2];
}

export function decodeOutputType(uri: vscode.Uri): string {
	return decodeURIComponent(uri.query).split("::")[1];
}