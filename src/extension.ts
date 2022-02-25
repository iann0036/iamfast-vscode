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
	
	const commandRegistration = commands.registerTextEditorCommand('iamfast.showIAMPolicy', async editor => {
		referenceProvider.setDoc(editor.document);
		const uri = encodeLocation(editor.document.uri);
		const doc = await workspace.openTextDocument(uri);
		languages.setTextDocumentLanguage(doc, 'json');
		
		return await window.showTextDocument(doc, ViewColumn.Beside, true);
	});

	context.subscriptions.push(
		provider,
		commandRegistration,
		providerRegistrations
	);
}