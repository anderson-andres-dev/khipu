//! Incremental, error-tolerant parsing of the buffer being edited (tree-sitter),
//! plus validation against the real dialect grammar (sqlparser) on demand.

use crate::Dialect;
use sqlparser::parser::{Parser, ParserError};

pub fn validate(sql: &str, dialect: Dialect) -> Result<(), ParserError> {
    Parser::parse_sql(&*dialect.as_sqlparser_dialect(), sql).map(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_accepts_valid_sql_for_mysql() {
        assert!(validate("SELECT 1", Dialect::MySql).is_ok());
    }

    #[test]
    fn validate_rejects_invalid_sql_for_mysql() {
        assert!(validate("SELEKT 1 FRUM x", Dialect::MySql).is_err());
    }

    #[test]
    fn validate_accepts_valid_sql_for_postgres() {
        assert!(validate("SELECT 1", Dialect::Postgres).is_ok());
    }

    #[test]
    fn validate_rejects_invalid_sql_for_postgres() {
        assert!(validate("SELEKT 1 FRUM x", Dialect::Postgres).is_err());
    }
}
