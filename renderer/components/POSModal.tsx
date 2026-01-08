import React from 'react'

interface Props {
  onClose?: () => void
}

/**
 * POSModal - Reusable modal component for POS system
 */
export function POSModal({ children, onClose }: React.PropsWithChildren<Props>) {
  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
