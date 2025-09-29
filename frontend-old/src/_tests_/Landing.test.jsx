import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from '../pages/Landing';
import { MemoryRouter } from 'react-router-dom';

const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('LandingPage', () => {
  beforeEach(() => {
    mockedNavigate.mockClear();
  });

  test('renders all key elements', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    // Valid text checks
    expect(screen.getByText(/Protect Yourself Online/i)).toBeInTheDocument();
    expect(screen.getByText(/Report suspicious URLs and help make the web safer for everyone/i)).toBeInTheDocument();
    expect(screen.getByText(/B\.R\.A\.D\. Performance Stats/i)).toBeInTheDocument();
    expect(screen.getByText(/About/i)).toBeInTheDocument();
    expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
    expect(screen.getByText(/Walkthrough Video/i)).toBeInTheDocument();

    // Buttons & links
    expect(screen.getByRole('button', { name: /Get Started/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();

    // Images
    expect(screen.getByAltText('BRAD Robot')).toBeInTheDocument();
  });

  test('clicking "Get Started" navigates to /register', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const getStartedButton = screen.getByRole('button', { name: /Get Started/i });
    fireEvent.click(getStartedButton);

    // If it uses useNavigate
    expect(mockedNavigate).toHaveBeenCalledWith('/register');
  });

  test('clicking "Login" uses correct href', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const loginLink = screen.getByRole('link', { name: /Login/i });
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});
