import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '../../test/utils'
import LogIn from './LogIn'

describe('LogIn Page', () => {
  it('renders login form', () => {
    render(<LogIn />)

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('shows error when submitting empty form', async () => {
    render(<LogIn />)

    const form = screen.getByRole('form', { name: /login-form/i })
    fireEvent.submit(form)

    expect(await screen.findByTestId('error-message')).toHaveTextContent(/please enter both email and password/i)
  })

  it('calls login when form is valid', () => {
    render(<LogIn />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })

    const form = screen.getByRole('form', { name: /login-form/i })
    fireEvent.submit(form)

    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
  })
})
