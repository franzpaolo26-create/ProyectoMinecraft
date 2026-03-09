// frontend/src/components/Table.jsx
// Tabla reutilizable sin librerías externas.
// - columns define qué columnas se muestran y cómo renderizar cada celda.
// - render (opcional) permite formatear valores (fechas, JSON, etc.).

import React from 'react';

export default function Table({
  columns,
  rows,
  rowKey,
  emptyText,
  onRowClick,
}) {
  const hasRows = Array.isArray(rows) && rows.length > 0;

  // Row key:
  // - si pasas string => usa row[string]
  // - si pasas función => rowKey(row) devuelve la key
  function getRowKey(row, index) {
    if (typeof rowKey === 'function') return rowKey(row);
    if (typeof rowKey === 'string' && row && row[rowKey] != null) return row[rowKey];
    return index; // fallback seguro (mejor pasar rowKey real)
  }

  const clickable = typeof onRowClick === 'function';

  const styles = {
    wrapper: { width: '100%', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' },
    th: {
      textAlign: 'left',
      padding: '10px',
      borderBottom: '1px solid #ddd',
      background: '#f6f6f6',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    },
    td: { padding: '10px', borderBottom: '1px solid #eee', verticalAlign: 'top' },
    empty: {
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '6px',
      background: '#fafafa',
    },
    rowClickable: { cursor: 'pointer' },
  };

  if (!hasRows) {
    return <div style={styles.empty}>{emptyText || 'Sin datos'}</div>;
  }

  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={styles.th}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => {
            const key = getRowKey(row, index);

            return (
              <tr
                key={key}
                onClick={clickable ? () => onRowClick(row) : undefined}
                style={clickable ? styles.rowClickable : undefined}
              >
                {columns.map((col) => {
                  // Si hay render, lo usamos para la celda; si no, mostramos row[col.key]
                  const value = row?.[col.key];
                  const cell =
                    typeof col.render === 'function' ? col.render(value, row) : value;

                  return (
                    <td key={col.key} style={styles.td}>
                      {cell ?? ''}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}