import React from 'react'
import './Widget.css'

/**
 * Widget: A highly reusable, accessible dashboard card
 * - title: Widget title (shown in h3)
 * - children: Widget content
 * - actions: Optional element, e.g. menu button (top right)
 * - className: Additional CSS classes for custom styling
 * - ...props: Extra props (id, tabIndex, aria-*, etc.)
 */
function Widget({ title, children, actions, className = '', ...props }) {
  // Ensure a unique id for ARIA (if needed for headings)
  const headingId = props.id ? `${props.id}-heading` : undefined

  return (
    <section
      className={`widget ${className}`}
      tabIndex={0}
      aria-label={title || 'Dashboard Widget'}
      aria-labelledby={headingId}
      {...props}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        {title ? (
          <h3
            id={headingId}
            style={{
              marginBottom: 10,
              fontSize: '1.18rem',
              fontWeight: 800,
              flex: 1,
              color: '#1275f6',
            }}
          >
            {title}
          </h3>
        ) : null}
        {/* Actions slot for buttons, menus, etc. */}
        {actions && (
          <div className="widget-actions" style={{ marginLeft: 6 }}>
            {actions}
          </div>
        )}
      </div>
      <div className="widget-content">{children}</div>
    </section>
  )
}

export default Widget
