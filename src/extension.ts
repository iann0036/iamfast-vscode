import { workspace, window, languages, commands, ExtensionContext, Disposable, ViewColumn, DocumentLink, DocumentLinkProvider } from 'vscode';
import Provider, { encodeLocation } from './provider';
import IAMFastReferenceProvider from './referenceprovider';

export function activate(context: ExtensionContext) {

	const referenceProvider = new IAMFastReferenceProvider();
	const provider = new Provider(referenceProvider);
	const providerRegistrations = Disposable.from(
		workspace.registerTextDocumentContentProvider(Provider.scheme, provider),
		languages.registerReferenceProvider([
			{ pattern: 'IAM Policy', language: 'json' }
		], referenceProvider)
	);
	
	const fileCommandRegistration = commands.registerTextEditorCommand('iamfast.generateFileIAMPolicy', async editor => {
		referenceProvider.setDoc(editor.document);
		const uri = encodeLocation(editor.document.uri, 'file');
		const doc = await workspace.openTextDocument(uri);
		languages.setTextDocumentLanguage(doc, 'json');
		
		return await window.showTextDocument(doc, ViewColumn.Beside, true);
	});
	
	const workspaceCommandRegistration = commands.registerTextEditorCommand('iamfast.generateWorkspaceIAMPolicy', async editor => {
		const workspaceFolder = workspace.getWorkspaceFolder(editor.document.uri);
		if (workspaceFolder !== undefined) {
			referenceProvider.setWorkspaceFolder(workspaceFolder!);
			const uri = encodeLocation(workspaceFolder.uri, 'workspace');
			const doc = await workspace.openTextDocument(uri);
			languages.setTextDocumentLanguage(doc, 'json');
			
			return await window.showTextDocument(doc, ViewColumn.Beside, true);
		}
	});

	context.subscriptions.push(
		provider,
		fileCommandRegistration,
		workspaceCommandRegistration,
		providerRegistrations
	);
}