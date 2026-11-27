import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

export function Overlay({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => { element?.close() }
  }, [])
  return <dialog ref={dialog} className="vn-overlay" aria-label={title} onCancel={event => {
    event.preventDefault()
    onClose()
  }}>
    <header><h2>{title}</h2><button type="button" autoFocus onClick={onClose}>Cerrar</button></header>
    <div className="vn-overlay-content">{children}</div>
  </dialog>
}
