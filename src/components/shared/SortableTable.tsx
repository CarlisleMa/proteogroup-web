'use client';

interface Column<T> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface SortableTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  currentSort?: { key: string; order: 'asc' | 'desc' };
  onSort?: (key: string) => void;
}

function SortIndicator({
  active,
  order,
}: {
  active: boolean;
  order: 'asc' | 'desc';
}) {
  if (!active) {
    return (
      <span className="ml-1 text-slate-300 inline-block w-4 text-center">
        &uarr;&darr;
      </span>
    );
  }
  return (
    <span className="ml-1 text-blue-600 inline-block w-4 text-center">
      {order === 'asc' ? '\u2191' : '\u2193'}
    </span>
  );
}

export default function SortableTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  currentSort,
  onSort,
}: SortableTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${
                  col.sortable && onSort ? 'cursor-pointer select-none hover:text-slate-700' : ''
                }`}
                onClick={() => {
                  if (col.sortable && onSort) onSort(col.key);
                }}
              >
                <span className="inline-flex items-center">
                  {col.label}
                  {col.sortable && onSort && (
                    <SortIndicator
                      active={currentSort?.key === col.key}
                      order={currentSort?.key === col.key ? currentSort.order : 'asc'}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={`
                ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                ${onRowClick ? 'cursor-pointer hover:bg-blue-50/50 transition-colors' : ''}
              `}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700">
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '\u2014')}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-slate-400"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
