import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RegisterPage from '../pages/Register';
import { MemoryRouter } from 'react-router-dom';

const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

jest.mock('../api/axios', () => ({
  post: jest.fn(() =>
    Promise.resolve({ data: { message: 'User registered successfully' } })
  ),
}));

jest.useFakeTimers();

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
    expect(screen.getAllByRole('button', { name: /Login/i }).length).toBeGreaterThan(0);
    expect(screen.getByAltText('BRAD Robot')).toBeInTheDocument();
  });

  test('shows error if passwords do not match', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('First Name'), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByPlaceholderText('Last Name'), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'johndoe' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
      target: { value: 'notmatching' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Register/i }));
    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

});
