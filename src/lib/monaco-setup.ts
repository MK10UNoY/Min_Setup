/**
 * Monaco Editor setup — registers web workers for language services.
 */
import * as monaco from 'monaco-editor';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';

self.MonacoEnvironment = {
	getWorker: function (_: string, label: string) {
		switch (label) {
			case 'typescript':
			case 'javascript':
				return new TsWorker();
			case 'json':
				return new JsonWorker();
			case 'css':
			case 'scss':
			case 'less':
				return new CssWorker();
			case 'html':
			case 'handlebars':
			case 'razor':
				return new HtmlWorker();
			default:
				return new EditorWorker();
		}
	}
};

export default monaco;