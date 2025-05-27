import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RegisterPage from '../pages/Register';
import { MemoryRouter } from 'react-router-dom';

const mockedNavigate = jest.fn();

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    mockedNavigate.mockClear();
  });

  test('renders form inputs and buttons', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByAltText('BRAD Robot')).toBeInTheDocument();
  });

  test('shows error if passwords do not match', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/First Name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Email/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
      target: { value: 'notmatching' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  test('navigates to /login after successful registration', () => {
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByPlaceholderText('First Name'), {
    target: { value: 'Jane' },
  });
  fireEvent.change(screen.getByPlaceholderText('Last Name'), {
    target: { value: 'Smith' },
  });
  fireEvent.change(screen.getByPlaceholderText('Email'), {
    target: { value: 'jane@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('Password'), {
    target: { value: 'password123' },
  });
  fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
    target: { value: 'password123' },
  });

  fireEvent.click(screen.getByRole('button', { name: /Register/i }));
  expect(mockedNavigate).toHaveBeenCalledWith('/login');
});

  test('login button navigates to login page', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const loginBtn = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(loginBtn);
    expect(mockedNavigate).toHaveBeenCalledWith('/login');
  });

});
