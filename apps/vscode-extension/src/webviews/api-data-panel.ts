import * as fs from 'fs';
import * as vscode from 'vscode';
import { dispatchAgentCall } from '../utils/dispatch-agent-call';

const BLOCKUS_BASE_URL = 'https://blockus.lndevui.com';
const BLOCKUS_NAMESPACE = 'blockus';

type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';
const PACKAGE_MANAGERS: PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];

// Build the shadcn install command for a block, per package manager.
function installCommandFor(pm: PackageManager, id: string): string {
  const slug = `@${BLOCKUS_NAMESPACE}/${id}`;
  switch (pm) {
    case 'npm':
      return `npx shadcn@latest add ${slug}`;
    case 'yarn':
      return `yarn dlx shadcn@latest add ${slug}`;
    case 'bun':
      return `bunx --bun shadcn@latest add ${slug}`;
    default:
      return `pnpm dlx shadcn@latest add ${slug}`;
  }
}

interface BlockusBlock {
  id: string;
  name: string;
  category: string;
  isPro: boolean;
  previewImage?: string;
  tags?: string[];
  installable: boolean;
  installCommand: string;
}

interface BlockusCatalog {
  unlocked: boolean;
  total: number;
  blocks: BlockusBlock[];
}

// Sidebar webview that lists blockus blocks. Free blocks install for everyone;
// Pro blocks unlock once a valid API key (bk_live_…) is set in settings.
export class ApiDataProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'blockus.apiDataView';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'requestInitialData':
        case 'refresh':
          await this._fetchCatalog();
          break;
        case 'saveApiKey':
          await this._saveApiKey(data.apiKey ?? '');
          break;
        case 'setPackageManager':
          await this._setPackageManager(data.pm);
          break;
        case 'installBlock':
          await this._installBlock(data.id);
          break;
        case 'sendToAgent':
          await this._sendToAgent(data.id, data.name);
          break;
        case 'previewBlock':
          if (data.id) {
            vscode.env.openExternal(
              vscode.Uri.parse(`${BLOCKUS_BASE_URL}/preview/${data.id}`),
            );
          }
          break;
        case 'openExternal':
          if (data.url) {
            vscode.env.openExternal(vscode.Uri.parse(data.url));
          }
          break;
        case 'copyToClipboard':
          await vscode.env.clipboard.writeText(data.text ?? '');
          vscode.window.showInformationMessage('📋 Copied to clipboard!');
          break;
      }
    });
  }

  private _getApiKey(): string {
    const config = vscode.workspace.getConfiguration('blockus');
    return config.get('apiKey', '');
  }

  private _getPackageManager(): PackageManager {
    const pm = vscode.workspace
      .getConfiguration('blockus')
      .get<string>('packageManager', 'pnpm');
    return (PACKAGE_MANAGERS as string[]).includes(pm)
      ? (pm as PackageManager)
      : 'pnpm';
  }

  private async _setPackageManager(pm: string) {
    const valid = (PACKAGE_MANAGERS as string[]).includes(pm) ? pm : 'pnpm';
    await vscode.workspace
      .getConfiguration('blockus')
      .update('packageManager', valid, vscode.ConfigurationTarget.Global);
  }

  private _buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    const apiKey = this._getApiKey();
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }
    return headers;
  }

  private async _fetchCatalog() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'loading', loading: true });
    }

    try {
      const response = await fetch(`${BLOCKUS_BASE_URL}/api/blocks`, {
        method: 'GET',
        headers: this._buildHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const catalog = (await response.json()) as BlockusCatalog;

      if (this._view) {
        this._view.webview.postMessage({
          type: 'catalog',
          unlocked: catalog.unlocked,
          total: catalog.total,
          blocks: catalog.blocks,
          packageManager: this._getPackageManager(),
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error fetching blockus catalog:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to fetch blocks from blockus';
      vscode.window.showErrorMessage(`blockus: ${message}`);
      if (this._view) {
        this._view.webview.postMessage({
          type: 'error',
          message,
          loading: false,
        });
      }
    }
  }

  private async _saveApiKey(apiKey: string) {
    const trimmed = apiKey.trim();
    try {
      await vscode.workspace
        .getConfiguration('blockus')
        .update('apiKey', trimmed, vscode.ConfigurationTarget.Global);

      if (trimmed && !trimmed.startsWith('bk_live_')) {
        vscode.window.showWarningMessage(
          'blockus API keys start with "bk_live_". Double-check your key.',
        );
      } else if (trimmed) {
        vscode.window.showInformationMessage('blockus API key saved ✅');
      }

      // Refetch with the new key so Pro blocks unlock immediately.
      await this._fetchCatalog();
    } catch (error) {
      console.error('Error saving API key:', error);
      vscode.window.showErrorMessage('Failed to save blockus API key');
    }
  }

  // Run the shadcn install command in the integrated terminal.
  private async _installBlock(id: string) {
    if (!id) return;
    const command = installCommandFor(this._getPackageManager(), id);
    const terminal =
      vscode.window.terminals.find((t) => t.name === 'blockus') ??
      vscode.window.createTerminal('blockus');
    terminal.show();
    terminal.sendText(command);
  }

  // Pull a block's source from the registry and hand it to the IDE agent.
  private async _sendToAgent(id: string, name?: string) {
    if (!id) return;
    try {
      vscode.window.showInformationMessage('⏳ Fetching block source…');
      const response = await fetch(`${BLOCKUS_BASE_URL}/r/${id}.json`, {
        method: 'GET',
        headers: this._buildHeaders(),
      });

      if (response.status === 401) {
        vscode.window.showWarningMessage(
          'This is a Pro block. Set your blockus API key (bk_live_…) to unlock it.',
        );
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const item = (await response.json()) as {
        files?: Array<{ target?: string; path?: string; content?: string }>;
      };
      const files = Array.isArray(item.files) ? item.files : [];
      const sources = files
        .map((f) => `// ${f.target || f.path}\n\n${f.content ?? ''}`)
        .join('\n\n');

      const installCmd = installCommandFor(this._getPackageManager(), id);
      const prompt = `Integrate this blockus block "${name || id}" into the current codebase.

Install it first with:
\`\`\`bash
${installCmd}
\`\`\`

Here is its source for reference:

\`\`\`tsx
${sources}
\`\`\`

1. Run the install command (it pulls the block + its dependencies via the shadcn registry).
2. Place the block where it fits the current page/layout.
3. Wire up any props, data and links to the surrounding code.`;

      await dispatchAgentCall({ prompt });
      vscode.window.showInformationMessage('🤖 Sent to IDE agent!');
    } catch (error) {
      console.error('Error sending block to agent:', error);
      vscode.window.showErrorMessage('Failed to send block to IDE agent');
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const mediaPath = vscode.Uri.joinPath(
      this._extensionUri,
      'out',
      'src',
      'webviews',
      'media',
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(mediaPath, 'api-panel.css'),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(mediaPath, 'api-panel.js'),
    );

    const htmlPath = vscode.Uri.joinPath(mediaPath, 'api-panel.html');
    let htmlContent: string;

    try {
      const htmlBytes = fs.readFileSync(htmlPath.fsPath);
      htmlContent = htmlBytes.toString();
    } catch (error) {
      console.error('Error reading HTML template:', error);
      return this._getErrorHtml('Failed to load HTML template');
    }

    htmlContent = htmlContent
      .replace('{{styleUri}}', styleUri.toString())
      .replace('{{scriptUri}}', scriptUri.toString());

    return htmlContent;
  }

  private _getErrorHtml(errorMessage: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <h2>Error Loading Panel</h2>
    <p>${errorMessage}</p>
</body>
</html>`;
  }
}
