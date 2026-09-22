use tower_lsp::jsonrpc::Result;
use tower_lsp::lsp_types::*;
use tower_lsp::{Client, LanguageServer, LspService, Server};

struct KhipuLanguageServer {
    #[allow(dead_code)]
    client: Client,
}

#[tower_lsp::async_trait]
impl LanguageServer for KhipuLanguageServer {
    async fn initialize(&self, _: InitializeParams) -> Result<InitializeResult> {
        // `completion_provider` and `text_document_sync` are intentionally not
        // announced here: the server does not implement `did_open`/`did_change`
        // yet, and `completion` always returns an empty list. Advertising a
        // capability the server doesn't back is worse than not advertising it.
        Ok(InitializeResult {
            capabilities: ServerCapabilities {
                ..Default::default()
            },
            ..Default::default()
        })
    }

    async fn shutdown(&self) -> Result<()> {
        Ok(())
    }

    async fn completion(&self, _: CompletionParams) -> Result<Option<CompletionResponse>> {
        Ok(Some(CompletionResponse::Array(vec![])))
    }
}

#[tokio::main]
async fn main() {
    let stdin = tokio::io::stdin();
    let stdout = tokio::io::stdout();

    let (service, socket) = LspService::new(|client| KhipuLanguageServer { client });
    Server::new(stdin, stdout, socket).serve(service).await;
}
