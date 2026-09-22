//! Incremental, error-tolerant parsing of the buffer being edited (tree-sitter),
//! plus validation against the real dialect grammar (sqlparser) on demand.

use crate::Dialect;
use sqlparser::parser::{Parser, ParserError};

pub fn validate(sql: &str, dialect: Dialect) -> Result<(), ParserError> {
    Parser::parse_sql(&*dialect.as_sqlparser_dialect(), sql).map(|_| ())
}
