import { useState } from 'react';

import { ConfirmDialog } from '../components/subjects/ConfirmDialog.jsx';
import { SubjectCard } from '../components/subjects/SubjectCard.jsx';
import { SubjectFormModal } from '../components/subjects/SubjectFormModal.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorBanner } from '../components/ui/ErrorBanner.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useSubjects } from '../hooks/useSubjects.js';

const CONFIRM_CONTENT = {
  archive: {
    title: 'Archivar materia',
    message:
      'La materia se archivará si tiene sesiones. Si no tiene ninguna, se eliminará definitivamente.',
    confirmLabel: 'Archivar',
    variant: 'primary'
  },
  restore: {
    title: 'Restaurar materia',
    message:
      'La materia volverá a aparecer en el selector, el temporizador y los reportes.',
    confirmLabel: 'Restaurar',
    variant: 'primary'
  },
  delete: {
    title: 'Eliminar materia',
    message:
      'Si la materia no tiene sesiones se eliminará definitivamente. Si tiene sesiones, seguirá archivada para conservar el historial.',
    confirmLabel: 'Eliminar',
    variant: 'danger'
  }
};

export function Subjects() {
  const {
    subjects,
    loading,
    error,
    reload,
    create,
    update,
    remove,
    restore
  } = useSubjects({ includeArchived: true });
  const [formModal, setFormModal] = useState({ open: false, subject: null });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: null,
    subject: null
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const activeSubjects = subjects.filter((subject) => !subject.isArchived);
  const archivedSubjects = subjects.filter((subject) => subject.isArchived);

  function openCreate() {
    setFormModal({ open: true, subject: null });
  }

  function openEdit(subject) {
    setFormModal({ open: true, subject });
  }

  function openConfirm(type, subject) {
    setActionError(null);
    setConfirmDialog({ open: true, type, subject });
  }

  function closeConfirm() {
    if (actionLoading) {
      return;
    }

    setActionError(null);
    setConfirmDialog({ open: false, type: null, subject: null });
  }

  async function handleSave(payload) {
    if (formModal.subject) {
      await update(formModal.subject.id, payload);
      return;
    }

    await create(payload);
  }

  async function handleConfirm() {
    if (!confirmDialog.subject || !confirmDialog.type) {
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      if (confirmDialog.type === 'restore') {
        await restore(confirmDialog.subject.id);
      } else {
        await remove(confirmDialog.subject.id);
      }

      setConfirmDialog({ open: false, type: null, subject: null });
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setActionLoading(false);
    }
  }

  const confirmContent = confirmDialog.type
    ? CONFIRM_CONTENT[confirmDialog.type]
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">Materias</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Tus materias
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Organizá lo que estudiás y usá el color para reconocer cada materia
            en el temporizador y los reportes.
          </p>
        </div>
        <Button onClick={openCreate}>Nueva materia</Button>
      </div>

      {error ? (
        <div className="space-y-3">
          <ErrorBanner message={error.message} />
          <Button variant="secondary" onClick={reload}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10">
          <Spinner label="Cargando materias…" />
        </div>
      ) : null}

      {!loading && !error && activeSubjects.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Todavía no tenés materias activas
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            Creá tu primera materia para empezar a registrar sesiones de
            estudio.
          </p>
          <Button className="mt-5" onClick={openCreate}>
            Crear mi primera materia
          </Button>
        </section>
      ) : null}

      {activeSubjects.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2">
          {activeSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={openEdit}
              onArchive={(item) => openConfirm('archive', item)}
              onDelete={(item) => openConfirm('delete', item)}
              onRestore={(item) => openConfirm('restore', item)}
            />
          ))}
        </section>
      ) : null}

      {archivedSubjects.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Archivadas ({archivedSubjects.length})
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Conservan sus sesiones. Podés restaurarlas cuando las vuelvas a
              necesitar.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {archivedSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onEdit={openEdit}
                onArchive={(item) => openConfirm('archive', item)}
                onDelete={(item) => openConfirm('delete', item)}
                onRestore={(item) => openConfirm('restore', item)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {formModal.open ? (
        <SubjectFormModal
          key={formModal.subject?.id ?? 'new'}
          subject={formModal.subject}
          onClose={() => setFormModal({ open: false, subject: null })}
          onSubmit={handleSave}
        />
      ) : null}

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmContent?.title}
        message={confirmContent?.message}
        confirmLabel={confirmContent?.confirmLabel}
        variant={confirmContent?.variant}
        loading={actionLoading}
        error={actionError}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
