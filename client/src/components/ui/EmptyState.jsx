export function EmptyState({ title, children, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {children ? (
        <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          {children}
        </div>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
