import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../pages/Login';
import { MemoryRouter } from 'react-router-dom';

const mockedNavigate = jest.fn();

// Mock useNavigate and modal component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

jest.mock('../components/ForgotPasswordModal', () => () => (
  <div data-testid="forgot-password-modal">Forgot Password Modal</div>
));

describe('LoginPage', () => {
  beforeEach(() => {
    mockedNavigate.mockClear();
  });

  test('renders login form with all elements', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Login to B\.R\.A\.D/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Forgot Password\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register here/i })).toBeInTheDocument();
    expect(screen.getByAltText('BRAD Robot')).toBeInTheDocument();
  });

  test('shows error if fields are empty on submit', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    expect(screen.getByText(/Please enter both username and password/i)).toBeInTheDocument();
  });

  test('navigates to /dashboard for normal users', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Username/i), {
      target: { value: 'user123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: 'pass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('opens Forgot Password modal', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Forgot Password\?/i }));
    expect(screen.getByTestId('forgot-password-modal')).toBeInTheDocument();
  });
});
