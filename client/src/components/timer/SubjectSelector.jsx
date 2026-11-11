export function SubjectSelector({ subjects, value, onChange, disabled }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor="timer-subject"
        className="block text-sm font-medium text-slate-700"
      >
        Materia
      </label>
      <select
        id="timer-subject"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        <option value="">Elegí una materia</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>
    </div>
  );
}
