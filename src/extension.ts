import { executionAsyncResource } from 'async_hooks';
import { workspace, window, languages, commands, ExtensionContext, Disposable, ViewColumn, DocumentLink, DocumentLinkProvider, Uri, TextDocument } from 'vscode';
import Provider, { encodeLocation } from './provider';
import IAMFastReferenceProvider from './referenceprovider';

export function activate(context: ExtensionContext) {

	const referenceProvider = new IAMFastReferenceProvider();
	const provider = new Provider(referenceProvider);
	const providerRegistrations = Disposable.from(
		workspace.registerTextDocumentContentProvider(Provider.scheme, provider),
		languages.registerReferenceProvider([
			{ pattern: 'IAM Policy', language: 'json' },
			{ pattern: 'IAM Policy', language: 'yaml' },
			{ pattern: 'IAM Policy', language: 'terraform' }
		], referenceProvider)
	);
	let iamDoc: TextDocument;
	
	const commandRegistration = commands.registerTextEditorCommand('iamfast.generateIAMPolicy', async editor => {
		let config = workspace.getConfiguration('iamfast');

		let scopes = [
			{ id: 'workspace', label: 'workspace', description: 'Scans all supported files within the current workspace' }
		];

		if (['javascript', 'javascriptreact', 'jsx', 'c', 'cpp', 'go', 'java', 'python', 'json'].includes(editor.document.languageId)) {
			scopes.unshift({ id: 'file', label: 'file', description: 'Scans only the currently open file' });
		}
		
		let scope;
		let scopeConfig: string | undefined = config.get("defaultScope");
		if (scopeConfig === "prompt" || !scopeConfig) {
			scope = await window.showQuickPick(scopes, {
				title: 'Scope of the IAM policy'
			});
		} else {
			scope = {
				id: scopeConfig
			};
		}
		if (!scope) {
			return;
		}

		let language;
		let languageConfig: string | undefined = config.get("defaultLanguage");
		if (languageConfig === "prompt" || !languageConfig) {
			language = await window.showQuickPick([
				{ id: 'json', languageId: 'json', label: 'json', description: 'Outputs a JSON-formatted policy' },
				{ id: 'yaml', languageId: 'yaml', label: 'yaml', description: 'Outputs a YAML-formatted policy' },
				{ id: 'sam', languageId: 'yaml', label: 'sam', description: 'Outputs a SAM template' },
				{ id: 'hcl', languageId: 'terraform', label: 'hcl', description: 'Outputs a Terraform template' }
			], {
				title: 'Output format of the IAM policy'
			});
		} else {
			language = {
				id: languageConfig,
				languageId: {
					'json': 'json',
					'yaml': 'yaml',
					'sam': 'yaml',
					'hcl': 'terraform'
				}[languageConfig!]
			};
		}
		if (!language) {
			return;
		}

		let uri: Uri;

		if (scope.id === "workspace") {
			const workspaceFolder = workspace.getWorkspaceFolder(editor.document.uri);
			if (workspaceFolder !== undefined) {
				referenceProvider.setWorkspaceFolder(workspaceFolder!);
				uri = encodeLocation(workspaceFolder.uri, 'workspace', language.id!);
			}
		} else if (scope.id === "file") {
			referenceProvider.setDoc(editor.document);
			uri = encodeLocation(editor.document.uri, 'file', language.id!);
		} else {
			return;
		}

		iamDoc = await workspace.openTextDocument(uri!);
		languages.setTextDocumentLanguage(iamDoc, language.languageId!);
		
		return await window.showTextDocument(iamDoc, ViewColumn.Beside, true);
	});
	
	context.subscriptions.push(
		provider,
		commandRegistration,
		providerRegistrations
	);
}