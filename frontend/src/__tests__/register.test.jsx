import { render, screen } from '@testing-library/react'
import RegisterPage from '@/app/register/page'

// Mock Next.js useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// Mock child components
jest.mock('@/components/AuthLayout', () => ({ children }) => <div>{children}</div>)
jest.mock('@/components/BackButton', () => () => <div>BackButton</div>)
jest.mock('@/components/Notification', () => ({ children }) => <div>{children}</div>)

describe('RegisterPage simple unit tests', () => {
  it('renders register form inputs and button', () => {
    render(<RegisterPage />)

    expect(screen.getByPlaceholderText(/john/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/doe/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/choose a username/i)).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText(/••••••••/i)).toHaveLength(2) // password + confirm
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('renders the heading text', () => {
    render(<RegisterPage />)
    expect(screen.getByText(/create your account/i)).toBeInTheDocument()
  })

  it('has a link to login page', () => {
    render(<RegisterPage />)
    const loginLink = screen.getByRole('link', { name: /sign in/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')
  })
})
