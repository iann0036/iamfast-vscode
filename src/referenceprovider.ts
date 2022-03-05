import * as vscode from 'vscode';

class UriPriv {
	public uri: vscode.Uri | undefined;
	public privs: any;
	public doc: vscode.TextDocument | undefined;
}

export default class IAMFastReferenceProvider implements vscode.ReferenceProvider {

	private uriPrivs: UriPriv[];
	private doc: vscode.TextDocument | undefined;
	private workspaceFolder: vscode.WorkspaceFolder | undefined;

	constructor() {
		this.uriPrivs = [];
	}

	setDoc(doc: vscode.TextDocument) {
		this.doc = doc;
	}

	setWorkspaceFolder(workspaceFolder: vscode.WorkspaceFolder) {
		this.workspaceFolder = workspaceFolder;
	}

	async set(uri: vscode.Uri, privs: any) {
		let doc = await vscode.workspace.openTextDocument(uri);

		this.uriPrivs.push({
			'uri': uri,
			'privs': privs,
			'doc': doc
		});
	}

	provideReferences(doc: vscode.TextDocument, position: vscode.Position, _context: vscode.ReferenceContext, _token: vscode.CancellationToken) {
		let locations: vscode.Location[] = [];

		for (let uriPriv of this.uriPrivs) {
			for (let priv of uriPriv['privs']) {
				locations.push(new vscode.Location(uriPriv.uri!, new vscode.Range(uriPriv.doc!.positionAt(priv.position.start), uriPriv.doc!.positionAt(priv.position.stop + 1))));
			}
		}

		return locations;
	}
}
