import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '../../test/utils'
import SignUp from './SignUp'

describe('SignUp Page', () => {
  it('renders signup form', () => {
    render(<SignUp />)

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('shows validation errors for invalid inputs', async () => {
    render(<SignUp />)

    const form = screen.getByRole('form', { name: /signup-form/i })
    fireEvent.submit(form)

    // Check for validation messages
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()

    // Check password mismatch
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'mismatch' } })
    fireEvent.submit(form)

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('submits successfully when form is valid', async () => {
    render(<SignUp />)

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } })

    const form = screen.getByRole('form', { name: /signup-form/i })
    fireEvent.submit(form)

    // Should not see errors
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument()
  })
})
