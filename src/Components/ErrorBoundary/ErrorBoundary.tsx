import React, { ReactNode, ErrorInfo } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error | null; retry: () => void }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo)
    
    // Log to external service in production
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(error, { extra: errorInfo })
      console.error('Production error logged:', { error, errorInfo })
    }
  }

  handleRetry = (): void => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent 
            error={this.state.error} 
            retry={this.handleRetry} 
          />
        )
      }

      // Default error UI
      return (
        <div style={{ 
          padding: '40px 20px', 
          textAlign: 'center', 
          maxWidth: '600px', 
          margin: '0 auto',
          fontFamily: 'system-ui, sans-serif',
          color: '#374151'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>😵</div>
          <h2 style={{ 
            color: '#dc2626', 
            marginBottom: '16px',
            fontSize: '24px',
            fontWeight: 600
          }}>
            Oops! Something went wrong
          </h2>
          <p style={{ 
            color: '#6b7280', 
            marginBottom: '24px', 
            lineHeight: 1.6,
            fontSize: '16px'
          }}>
            We're sorry for the inconvenience. The error has been logged and we'll look into it.
          </p>
          
          {/* Show error details in development */}
          {import.meta.env.DEV && this.state.error && (
            <details style={{ 
              marginBottom: '24px', 
              padding: '16px', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontWeight: 600, 
                color: '#991b1b',
                marginBottom: '8px'
              }}>
                Error Details (Development Mode)
              </summary>
              <pre style={{ 
                marginTop: '12px', 
                fontSize: '12px', 
                color: '#991b1b',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack && (
                  '\n\nComponent Stack:' + this.state.errorInfo.componentStack
                )}
              </pre>
            </details>
          )}
          
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={this.handleRetry}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
