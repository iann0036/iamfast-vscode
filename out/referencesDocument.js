"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class ReferencesDocument {
    constructor(uri, locations, emitter) {
        this._uri = uri;
        this._locations = locations;
        // The ReferencesDocument has access to the event emitter from
        // the containg provider. This allows it to signal changes
        this._emitter = emitter;
        // Start with printing a header and start resolving
        this._lines = [`Found ${this._locations.length} references`];
        this._links = [];
        this._populate();
    }
    get value() {
        return this._lines.join('\n');
    }
    get links() {
        return this._links;
    }
    _populate() {
        return __awaiter(this, void 0, void 0, function* () {
            // group all locations by files containg them
            const groups = [];
            let group = [];
            for (const loc of this._locations) {
                if (group.length === 0 || group[0].uri.toString() !== loc.uri.toString()) {
                    group = [];
                    groups.push(group);
                }
                group.push(loc);
            }
            //
            for (const group of groups) {
                const uri = group[0].uri;
                const ranges = group.map(loc => loc.range);
                yield this._fetchAndFormatLocations(uri, ranges);
                this._emitter.fire(this._uri);
            }
        });
    }
    _fetchAndFormatLocations(uri, ranges) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch the document denoted by the uri and format the matches
            // with leading and trailing content form the document. Make sure
            // to not duplicate lines
            try {
                const doc = yield vscode.workspace.openTextDocument(uri);
                this._lines.push('', uri.toString());
                for (let i = 0; i < ranges.length; i++) {
                    const { start: { line } } = ranges[i];
                    this._appendLeading(doc, line, ranges[i - 1]);
                    this._appendMatch(doc, line, ranges[i], uri);
                    this._appendTrailing(doc, line, ranges[i + 1]);
                }
            }
            catch (err) {
                this._lines.push('', `Failed to load '${uri.toString()}'\n\n${String(err)}`, '');
            }
        });
    }
    _appendLeading(doc, line, previous) {
        let from = Math.max(0, line - 3, previous && previous.end.line || 0);
        while (++from < line) {
            const text = doc.lineAt(from).text;
            this._lines.push(`  ${from + 1}` + (text && `  ${text}`));
        }
    }
    _appendMatch(doc, line, match, target) {
        const text = doc.lineAt(line).text;
        const preamble = `  ${line + 1}: `;
        // Append line, use new length of lines-array as line number
        // for a link that point to the reference
        const len = this._lines.push(preamble + text);
        // Create a document link that will reveal the reference
        const linkRange = new vscode.Range(len - 1, preamble.length + match.start.character, len - 1, preamble.length + match.end.character);
        const linkTarget = target.with({ fragment: String(1 + match.start.line) });
        this._links.push(new vscode.DocumentLink(linkRange, linkTarget));
    }
    _appendTrailing(doc, line, next) {
        const to = Math.min(doc.lineCount, line + 3);
        if (next && next.start.line - to <= 2) {
            return; // next is too close, _appendLeading does the work
        }
        while (++line < to) {
            const text = doc.lineAt(line).text;
            this._lines.push(`  ${line + 1}` + (text && `  ${text}`));
        }
        if (next) {
            this._lines.push(`  ...`);
        }
    }
}
exports.default = ReferencesDocument;
//# sourceMappingURL=referencesDocument.js.map