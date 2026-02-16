import { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [alertState, setAlertState] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const showAlert = useCallback((message, { variant = 'info', title } = {}) => {
    return new Promise((resolve) => {
      setAlertState({ message, variant, title, resolve });
    });
  }, []);

  const showConfirm = useCallback((message, { title = 'Confirm', confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false } = {}) => {
    return new Promise((resolve) => {
      setConfirmState({ message, title, confirmLabel, cancelLabel, danger, resolve });
    });
  }, []);

  const closeAlert = useCallback(() => {
    if (alertState?.resolve) alertState.resolve();
    setAlertState(null);
  }, [alertState]);

  const closeConfirm = useCallback((result) => {
    if (confirmState?.resolve) confirmState.resolve(result);
    setConfirmState(null);
  }, [confirmState]);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {alertState && (
        <div className="modal-backdrop" onClick={closeAlert} role="dialog" aria-modal="true" aria-labelledby="modal-alert-title">
          <div className={`modal-dialog modal-dialog--alert modal-dialog--${alertState.variant}`} onClick={(e) => e.stopPropagation()}>
            {alertState.title && <h3 id="modal-alert-title" className="modal-dialog__title">{alertState.title}</h3>}
            <p className="modal-dialog__message">{alertState.message}</p>
            <div className="modal-dialog__actions">
              <button type="button" className="btn btn-primary" onClick={closeAlert}>OK</button>
            </div>
          </div>
        </div>
      )}
      {confirmState && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-confirm-title">
          <div className="modal-dialog modal-dialog--confirm" onClick={(e) => e.stopPropagation()}>
            <h3 id="modal-confirm-title" className="modal-dialog__title">{confirmState.title}</h3>
            <p className="modal-dialog__message">{confirmState.message}</p>
            <div className="modal-dialog__actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => closeConfirm(false)}
              >
                {confirmState.cancelLabel}
              </button>
              <button
                type="button"
                className={confirmState.danger ? 'btn btn-danger' : 'btn btn-primary'}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
