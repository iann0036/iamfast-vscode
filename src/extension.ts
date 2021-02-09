import { workspace, window, languages, commands, ExtensionContext, Disposable } from 'vscode';
import Provider, { encodeLocation } from './provider';

export function activate(context: ExtensionContext) {

	const provider = new Provider();
	
	const providerRegistrations = Disposable.from(
		workspace.registerTextDocumentContentProvider(Provider.scheme, provider)
	);
	
	const commandRegistration = commands.registerTextEditorCommand('iamfast.showIAMPolicy', async editor => {
		const uri = encodeLocation(editor.document.uri);
		const doc = await workspace.openTextDocument(uri);
		languages.setTextDocumentLanguage(doc, 'json');
		
		return await window.showTextDocument(doc, (editor.viewColumn!) + 1, true);
	});

	context.subscriptions.push(
		provider,
		commandRegistration,
		providerRegistrations
	);
}