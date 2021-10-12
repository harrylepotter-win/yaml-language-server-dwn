import { FoldingRange } from 'vscode-languageserver';
import { FoldingRangesContext } from '../yamlTypes';
import { TextDocument } from 'vscode-languageserver-textdocument';
export declare function getFoldingRanges(document: TextDocument, context: FoldingRangesContext): FoldingRange[] | undefined;
