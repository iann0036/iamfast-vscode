import { off } from 'process';
import * as vscode from 'vscode';

class UriPriv {
	public uri: vscode.Uri | undefined;
	public privs: any;
	public doc: vscode.TextDocument | undefined;
}

export default class IAMFastReferenceProvider implements vscode.ReferenceProvider {

	private uriPrivs: UriPriv[];
	private positionalPrivs: any;
	private doc: vscode.TextDocument | undefined;
	private workspaceFolder: vscode.WorkspaceFolder | undefined;

	constructor() {
		this.uriPrivs = [];
		this.positionalPrivs = [];
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

	setPolicyContent(content: string) {
		let startPos = content.indexOf("{", 1);
		let endPos = content.indexOf("}", startPos) + 1;

		while (startPos !== -1 && endPos !== -1) {
			let action = content.substring(startPos, endPos).match(/\"Action\"\:\ \"([a-zA-Z0-9:]+)\"\,/)![1];

			let locations: vscode.Location[] = [];

			for (let uriPriv of this.uriPrivs) {
				for (let priv of uriPriv['privs']) {
					if (priv['action'] === action) {
						locations.push(new vscode.Location(uriPriv.uri!, new vscode.Range(uriPriv.doc!.positionAt(priv.position.start), uriPriv.doc!.positionAt(priv.position.stop + 1))));
					}
				}
			}

			this.positionalPrivs.push({
				'start': startPos,
				'end': endPos,
				'locations': locations,
				'action': action
			});

			startPos = content.indexOf("{", endPos);
			endPos = content.indexOf("}", startPos) + 1;
		}
	}

	provideReferences(doc: vscode.TextDocument, position: vscode.Position, _context: vscode.ReferenceContext, _token: vscode.CancellationToken) {
		let locations: vscode.Location[] = [];
		let offset = doc.offsetAt(position);

		for (let positionalPriv of this.positionalPrivs) {
			if (offset > positionalPriv['start'] && offset < positionalPriv['end']) {
				locations = locations.concat(positionalPriv['locations']);
			}
		}

		return locations;
	}
}
