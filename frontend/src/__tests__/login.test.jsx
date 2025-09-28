import { render, screen, fireEvent } from '@testing-library/react'
import LoginPage from '@/app/login/page'

// Mock Next.js useRouter
const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

// Mock all child components and localStorage
jest.mock('@/components/AuthLayout', () => ({ children }) => <div>{children}</div>)
jest.mock('@/components/BackButton', () => () => <div>BackButton</div>)
jest.mock('@/components/Notification', () => ({ title, children }) => (
  <div>
    {title && <strong>{title}</strong>}
    <div>{children}</div>
  </div>
))
jest.mock('@/components/ForgotPasswordModal', () => () => <div>ForgotPasswordModal</div>)

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
})

describe('LoginPage simple unit tests', () => {
  it('renders the login inputs and sign in button', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText(/you@example.com or username/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/•{8}/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('updates input values', () => {
    render(<LoginPage />)
    const usernameInput = screen.getByPlaceholderText(/you@example.com or username/i)
    const passwordInput = screen.getByPlaceholderText(/•{8}/)

    fireEvent.change(usernameInput, { target: { value: 'user1' } })
    fireEvent.change(passwordInput, { target: { value: 'pass123' } })

    expect(usernameInput.value).toBe('user1')
    expect(passwordInput.value).toBe('pass123')
  })

  it('shows forgot password modal when button clicked', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }))
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
  })

})
