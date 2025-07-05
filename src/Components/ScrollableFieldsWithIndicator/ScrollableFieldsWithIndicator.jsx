import React, { useRef, useEffect, useState } from 'react'
import './ScrollableFieldsWithIndicator.css'

// Accepts children: the fields to display and scroll
function ScrollableFieldsWithIndicator({ children, className = '' }) {
  const scrollRef = useRef(null)
  const [bubble, setBubble] = useState({
    visible: false,
    top: 0,
    height: 40, // default, will be updated
  })

  // On scroll, update bubble position & visibility
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let fadeTimeout
    function updateBubble() {
      const { scrollTop, scrollHeight, clientHeight } = el
      if (scrollHeight <= clientHeight) {
        setBubble((b) => ({ ...b, visible: false }))
        return
      }
      const bubbleHeight = Math.max(
        (clientHeight / scrollHeight) * clientHeight,
        36,
      )
      const top =
        (scrollTop / (scrollHeight - clientHeight)) *
        (clientHeight - bubbleHeight)

      setBubble({
        visible: true,
        top,
        height: bubbleHeight,
      })

      clearTimeout(fadeTimeout)
      fadeTimeout = setTimeout(() => {
        setBubble((b) => ({ ...b, visible: false }))
      }, 1100)
    }

    el.addEventListener('scroll', updateBubble)
    updateBubble()

    return () => {
      el.removeEventListener('scroll', updateBubble)
      clearTimeout(fadeTimeout)
    }
  }, [])

  return (
    <div
      className={`scrollable-bubble ${className}`}
      ref={scrollRef}
      tabIndex={0}
    >
      {children}
      <div
        className={`scroll-bubble-indicator${bubble.visible ? ' visible' : ''}`}
        style={{
          top: bubble.top,
          height: bubble.height,
          display: bubble.height >= 36 ? 'block' : 'none',
        }}
        aria-hidden="true"
      >
        <div className="bubble-inner" />
      </div>
    </div>
  )
}

export default ScrollableFieldsWithIndicator
