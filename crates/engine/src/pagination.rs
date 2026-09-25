//! Paginacion de resultados reescribiendo la consulta, no leyendo y
//! descartando filas: cada pagina le pide al servidor solo sus filas
//! (`LIMIT`/`OFFSET`), asi pasar a la pagina 20 cuesta lo mismo que la 1 del
//! lado de la app. Tambien arma el `SELECT COUNT(*)` para conocer el total.
//!
//! Solo se reescriben consultas que se pueden paginar con seguridad (un
//! `SELECT`/`UNION`/`VALUES` sin `FETCH`, `FOR UPDATE` ni `INTO`); para el
//! resto ambas funciones devuelven `None` y la app muestra solo la primera
//! pagina, como hasta ahora.

use crate::Dialect;
use sqlparser::ast::{
    Expr, GroupByExpr, LimitClause, Offset, OffsetRows, Query, SelectItem, SetExpr, Statement,
    Value,
};
use sqlparser::parser::Parser;

/// Pagina `sql` para traer `fetch` filas a partir de la fila `offset`.
///
/// Si la consulta ya tiene su propio `LIMIT`/`OFFSET` literal, la pagina se
/// calcula DENTRO de ese rango (una consulta con `LIMIT 50` nunca devuelve
/// mas de 50 filas en total, pagine como pagine).
pub fn paginate_sql(sql: &str, dialect: Dialect, offset: u64, fetch: u64) -> Option<String> {
    let mut query = parse_pageable_query(sql, dialect)?;
    let (base_offset, base_limit) = literal_limit(&query)?;

    let page_offset = base_offset.checked_add(offset)?;
    let page_limit = match base_limit {
        Some(limit) => fetch.min(limit.saturating_sub(offset)),
        None => fetch,
    };

    query.limit_clause = Some(LimitClause::LimitOffset {
        limit: Some(number(page_limit)),
        offset: (page_offset > 0).then(|| Offset {
            value: number(page_offset),
            rows: OffsetRows::None,
        }),
        limit_by: Vec::new(),
    });
    Some(query.to_string())
}

/// `SELECT COUNT(*)` sobre las filas que devolveria `sql` completa.
pub fn count_sql(sql: &str, dialect: Dialect) -> Option<String> {
    let mut query = parse_pageable_query(sql, dialect)?;
    let (_, limit) = literal_limit(&query)?;

    // Sin LIMIT el orden no cambia cuantas filas hay, y ordenar es lo mas
    // caro de muchas consultas. Con LIMIT si importa (decide CUALES entran).
    if limit.is_none() && query.limit_clause.is_none() {
        query.order_by = None;
    }

    // En una subconsulta derivada MySQL exige nombres de columna unicos: un
    // `SELECT * FROM a JOIN b` con dos columnas `id` fallaria. Si la
    // proyeccion no afecta cuantas filas salen (sin DISTINCT/GROUP BY/HAVING,
    // que podrian depender de ella o de sus alias), se reemplaza por `1`.
    if let SetExpr::Select(select) = query.body.as_mut() {
        let projection_is_irrelevant = select.distinct.is_none()
            && select.having.is_none()
            && matches!(&select.group_by, GroupByExpr::Expressions(exprs, modifiers) if exprs.is_empty() && modifiers.is_empty());
        if projection_is_irrelevant && query.limit_clause.is_none() {
            select.projection = vec![SelectItem::UnnamedExpr(number(1))];
        }
    }

    Some(format!("SELECT COUNT(*) FROM ({query}) AS khipu_count"))
}

fn parse_pageable_query(sql: &str, dialect: Dialect) -> Option<Query> {
    let mut statements = Parser::parse_sql(&*dialect.as_sqlparser_dialect(), sql).ok()?;
    if statements.len() != 1 {
        return None;
    }
    let Statement::Query(query) = statements.pop()? else {
        return None;
    };
    let pageable_body = match query.body.as_ref() {
        SetExpr::Select(select) => select.into.is_none(),
        SetExpr::SetOperation { .. } | SetExpr::Query(_) | SetExpr::Values(_) => true,
        _ => false,
    };
    let pageable = pageable_body
        && query.fetch.is_none()
        && query.locks.is_empty()
        && query.for_clause.is_none()
        && query.settings.is_none()
        && query.format_clause.is_none();
    pageable.then_some(*query)
}

/// `(offset, limit)` del `LIMIT`/`OFFSET` que ya trae la consulta, si son
/// numeros literales. `None` si son expresiones (un parametro, `LIMIT BY`,
/// etc.): ahi no se puede combinar con la pagina.
fn literal_limit(query: &Query) -> Option<(u64, Option<u64>)> {
    match &query.limit_clause {
        None => Some((0, None)),
        Some(LimitClause::LimitOffset {
            limit,
            offset,
            limit_by,
        }) => {
            if !limit_by.is_empty() {
                return None;
            }
            let limit = match limit {
                None => None,
                Some(expr) => Some(literal_u64(expr)?),
            };
            let offset = match offset {
                None => 0,
                Some(offset) => literal_u64(&offset.value)?,
            };
            Some((offset, limit))
        }
        Some(LimitClause::OffsetCommaLimit { offset, limit }) => {
            Some((literal_u64(offset)?, Some(literal_u64(limit)?)))
        }
    }
}

fn literal_u64(expr: &Expr) -> Option<u64> {
    match expr {
        Expr::Value(value) => match &value.value {
            Value::Number(number, _) => number.parse().ok(),
            _ => None,
        },
        _ => None,
    }
}

fn number(value: u64) -> Expr {
    Expr::value(Value::Number(value.to_string(), false))
}

#[cfg(test)]
mod tests {
    use super::*;

    const MYSQL: Dialect = Dialect::MySql;

    #[test]
    fn pagina_un_select_simple() {
        assert_eq!(
            paginate_sql("SELECT * FROM t", MYSQL, 0, 501).unwrap(),
            "SELECT * FROM t LIMIT 501"
        );
        assert_eq!(
            paginate_sql("SELECT * FROM t ORDER BY id", MYSQL, 500, 501).unwrap(),
            "SELECT * FROM t ORDER BY id LIMIT 501 OFFSET 500"
        );
    }

    #[test]
    fn pagina_dentro_del_limit_existente() {
        // LIMIT 50: la segunda pagina de 20 son las filas 20..40.
        assert_eq!(
            paginate_sql("SELECT * FROM t LIMIT 50", MYSQL, 20, 21).unwrap(),
            "SELECT * FROM t LIMIT 21 OFFSET 20"
        );
        // Ultima pagina: quedan 10 filas del LIMIT, no 21.
        assert_eq!(
            paginate_sql("SELECT * FROM t LIMIT 50", MYSQL, 40, 21).unwrap(),
            "SELECT * FROM t LIMIT 10 OFFSET 40"
        );
        // Sintaxis MySQL `LIMIT offset, limit`.
        assert_eq!(
            paginate_sql("SELECT * FROM t LIMIT 100, 30", MYSQL, 0, 21).unwrap(),
            "SELECT * FROM t LIMIT 21 OFFSET 100"
        );
    }

    #[test]
    fn no_pagina_lo_que_no_es_seguro() {
        assert!(paginate_sql("SHOW TABLES", MYSQL, 0, 501).is_none());
        assert!(paginate_sql("SELECT * FROM t FOR UPDATE", MYSQL, 0, 501).is_none());
        assert!(paginate_sql("UPDATE t SET a = 1", MYSQL, 0, 501).is_none());
        assert!(paginate_sql("SELECT 1; SELECT 2", MYSQL, 0, 501).is_none());
        assert!(paginate_sql("SELECT * FROM t LIMIT ?", MYSQL, 0, 501).is_none());
    }

    #[test]
    fn cuenta_sin_orden_y_sin_proyeccion() {
        assert_eq!(
            count_sql(
                "SELECT a.*, b.* FROM a JOIN b ON a.id = b.a_id ORDER BY a.id",
                MYSQL
            )
            .unwrap(),
            "SELECT COUNT(*) FROM (SELECT 1 FROM a JOIN b ON a.id = b.a_id) AS khipu_count"
        );
    }

    #[test]
    fn cuenta_conserva_lo_que_cambia_el_numero_de_filas() {
        assert_eq!(
            count_sql("SELECT DISTINCT pais FROM clientes", MYSQL).unwrap(),
            "SELECT COUNT(*) FROM (SELECT DISTINCT pais FROM clientes) AS khipu_count"
        );
        assert_eq!(
            count_sql(
                "SELECT pais, COUNT(*) AS n FROM clientes GROUP BY pais",
                MYSQL
            )
            .unwrap(),
            "SELECT COUNT(*) FROM (SELECT pais, COUNT(*) AS n FROM clientes GROUP BY pais) AS khipu_count"
        );
        assert_eq!(
            count_sql("SELECT * FROM t ORDER BY id LIMIT 10", MYSQL).unwrap(),
            "SELECT COUNT(*) FROM (SELECT * FROM t ORDER BY id LIMIT 10) AS khipu_count"
        );
    }
}
