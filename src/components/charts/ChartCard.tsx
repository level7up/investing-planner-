"use client";

import { useId, useState, type ReactNode } from "react";

export type ChartTable = {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
};

interface ChartCardProps {
  title: string;
  subtitle: string;
  table: ChartTable;
  isEmpty: boolean;
  emptyText: string;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, table, isEmpty, emptyText, children }: ChartCardProps) {
  const [isTable, setIsTable] = useState(false);
  const titleId = useId();

  return (
    <figure className="chart-card" aria-labelledby={titleId}>
      <div className="chart-head">
        <div>
          <h2 id={titleId}>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {!isEmpty && (
          <button className="btn btn-secondary btn-sm" type="button" aria-pressed={isTable} onClick={() => setIsTable((v) => !v)}>
            {isTable ? "عرض الرسم" : "عرض كجدول"}
          </button>
        )}
      </div>
      {isEmpty && <p className="chart-empty">{emptyText}</p>}
      {!isEmpty && isTable && (
        <div className="chart-table-wrap">
          <table className="chart-table">
            <thead><tr>{table.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!isEmpty && !isTable && children}
    </figure>
  );
}
