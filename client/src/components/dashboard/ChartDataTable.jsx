export function ChartDataTable({
  label = 'Ver datos',
  caption,
  columns,
  rows
}) {
  return (
    <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70">
      <summary className="cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
        {label}
      </summary>
      <div className="max-h-72 overflow-auto border-t border-slate-200">
        <table className="w-full min-w-max border-collapse text-left text-xs">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="sticky top-0 bg-slate-100 text-slate-600">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="whitespace-nowrap px-3 py-2 font-semibold"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.id ?? rowIndex}
                className="border-t border-slate-200 bg-white"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="whitespace-nowrap px-3 py-2 text-slate-700"
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
