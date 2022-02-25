import * as vscode from 'vscode';

export default class IAMFastReferenceProvider implements vscode.ReferenceProvider {

	private lastUri: vscode.Uri | undefined;
	private privs: any;
	private doc: vscode.TextDocument | undefined;

	constructor() {
	}

	setDoc(doc: vscode.TextDocument) {
		this.doc = doc;
	}

	set(uri: vscode.Uri, privs: any) {
		this.lastUri = uri;
		this.privs = privs;
	}

	provideReferences(doc: vscode.TextDocument, position: vscode.Position, _context: vscode.ReferenceContext, _token: vscode.CancellationToken) {
		let locations: vscode.Location[] = [];

		console.log(this.privs);

		for (let priv of this.privs) {
			locations.push(new vscode.Location(this.lastUri!, new vscode.Range(this.doc!.positionAt(priv.position.start), this.doc!.positionAt(priv.position.stop + 1))));
		}

		return locations;
	}
}
