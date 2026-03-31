import Parser from "web-tree-sitter"

export interface ParameterInformation {
  label: string | [number, number]
  documentation?: string
}

export interface RangeInFile {
  filepath: string
  range: Range
}

export interface Location {
  filepath: string
  position: Position
}

export interface Range {
  start: Position
  end: Position
}

export interface Position {
  line: number
  character: number
}

export interface BaseCompletionOptions {
  temperature?: number
  topP?: number
  presencePenalty?: number
  frequencyPenalty?: number
  stop?: string[]
  maxTokens?: number
  raw?: boolean
  stream?: boolean
  reasoning?: boolean
  reasoningBudgetTokens?: number
  promptCaching?: boolean
}

export interface CompletionOptions extends BaseCompletionOptions {
  model: string
}

export type TextMessagePart = {
  type: "text"
  text: string
}

export type MessagePart = TextMessagePart

export type MessageContent = string | MessagePart[]

export interface UserChatMessage {
  role: "user"
  content: MessageContent
}

/**
 * This is meant to be equivalent to the OpenAI [usage object](https://platform.openai.com/docs/api-reference/chat/object#chat/object-usage)
 * but potentially with additional information that is needed for other providers.
 */
export interface Usage {
  completionTokens: number
  promptTokens: number
  promptTokensDetails?: {
    cachedTokens?: number
    /** This an Anthropic-specific property */
    cacheWriteTokens?: number
    audioTokens?: number
  }
}

export interface AssistantChatMessage {
  role: "assistant"
  content: MessageContent
  usage?: Usage
}

export interface SystemChatMessage {
  role: "system"
  content: string
}

export type ChatMessage = UserChatMessage | AssistantChatMessage | SystemChatMessage

export interface SymbolWithRange extends RangeInFile {
  name: string
  type: Parser.SyntaxNode["type"]
  content: string
}

export interface CompiledMessagesResult {
  compiledChatMessages: ChatMessage[]
  didPrune: boolean
  contextPercentage: number
}

export type IdeType = "vscode" | "jetbrains"

export interface IdeInfo {
  ideType: IdeType
}

export interface FileStats {
  size: number
  lastModified: number
}

/** Map of file name to stats */
export type FileStatsMap = {
  [path: string]: FileStats
}

export interface IDE {
  getIdeInfo(): Promise<IdeInfo>

  getClipboardContent(): Promise<{ text: string; copiedAt: string }>

  getUniqueId(): Promise<string>

  getWorkspaceDirs(): Promise<string[]>

  fileExists(fileUri: string): Promise<boolean>

  writeFile(path: string, contents: string): Promise<void>

  saveFile(fileUri: string): Promise<void>

  readFile(fileUri: string): Promise<string>

  readRangeInFile(fileUri: string, range: Range): Promise<string>

  getOpenFiles(): Promise<string[]>

  getCurrentFile(): Promise<
    | undefined
    | {
        isUntitled: boolean
        path: string
        contents: string
      }
  >

  getFileStats(files: string[]): Promise<FileStatsMap>

  // LSP
  gotoDefinition(location: Location): Promise<RangeInFile[]>
  gotoTypeDefinition(location: Location): Promise<RangeInFile[]>
  getSignatureHelp(location: Location): Promise<SignatureHelp | null>
  getReferences(location: Location): Promise<RangeInFile[]>
  getDocumentSymbols(textDocumentIdentifier: string): Promise<DocumentSymbol[]>

  // Callbacks
  onDidChangeActiveTextEditor(callback: (fileUri: string) => void): void
}

export interface TabAutocompleteOptions {
  disable: boolean
  maxPromptTokens: number
  debounceDelay: number
  modelTimeout: number
  maxSuffixPercentage: number
  prefixPercentage: number
  maxSnippetPercentage: number
  transform?: boolean
  multilineCompletions: "always" | "never" | "auto"
  slidingWindowPrefixPercentage: number
  slidingWindowSize: number
  useCache: boolean
  onlyMyCode: boolean
  useRecentlyEdited: boolean
  useRecentlyOpened: boolean
  disableInFiles?: string[]
  useImports?: boolean
  showWhateverWeHaveAtXMs?: number
  // true = enabled, false = disabled, number = enabled with priority
  experimental_includeClipboard: boolean | number
  experimental_includeRecentlyVisitedRanges: boolean | number
  experimental_includeRecentlyEditedRanges: boolean | number
  experimental_includeDiff: boolean | number
  experimental_enableStaticContextualization: boolean
}

export interface RangeInFileWithContents {
  filepath: string
  range: {
    start: { line: number; character: number }
    end: { line: number; character: number }
  }
  contents: string
}

/**
 * Signature help represents the signature of something
 * callable. There can be multiple signatures but only one
 * active and only one active parameter.
 */
export class SignatureHelp {
  /**
   * One or more signatures.
   */
  signatures: SignatureInformation[]

  /**
   * The active signature.
   */
  activeSignature: number

  /**
   * The active parameter of the active signature.
   */
  activeParameter: number
}

/**
 * Represents the signature of something callable. A signature
 * can have a label, like a function-name, a doc-comment, and
 * a set of parameters.
 */
export class SignatureInformation {
  /**
   * The label of this signature. Will be shown in
   * the UI.
   */
  label: string
  /**
   * The parameters of this signature.
   */
  parameters: ParameterInformation[]

  /**
   * The index of the active parameter.
   *
   * If provided, this is used in place of {@linkcode SignatureHelp.activeParameter}.
   */
  activeParameter?: number
}

// See https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#symbolKind.
// We shift this one index down to match vscode.SymbolKind.
export enum SymbolKind {
  File = 0,
  Module = 1,
  Namespace = 2,
  Package = 3,
  Class = 4,
  Method = 5,
  Property = 6,
  Field = 7,
  Constructor = 8,
  Enum = 9,
  Interface = 10,
  Function = 11,
  Variable = 12,
  Constant = 13,
  String = 14,
  Number = 15,
  Boolean = 16,
  Array = 17,
  Object = 18,
  Key = 19,
  Null = 20,
  EnumMember = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

// See https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#symbolTag.
export type SymbolTag = 1

// See https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#documentSymbol.
export interface DocumentSymbol {
  name: string
  detail?: string
  kind: SymbolKind
  tags?: SymbolTag[]
  deprecated?: boolean
  range: Range
  selectionRange: Range
  children?: DocumentSymbol[]
}
