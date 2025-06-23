import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from '../pages/Landing';  // adjust if your file structure differs
import { MemoryRouter } from 'react-router-dom';

// Mock useNavigate from react-router-dom
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

    // Texts
    expect(screen.getByText(/Want to know more about BRAD\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
    expect(screen.getByText(/I'm B\.R\.A\.D/i)).toBeInTheDocument();
    expect(screen.getByText(/Bot to Report Abusive Domains/i)).toBeInTheDocument();

    // Buttons
    expect(screen.getByRole('button', { name: /Learn More/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();

    // Image alt text
    expect(screen.getByAltText('BRAD Robot')).toBeInTheDocument();
  });

  test('clicking "Login" navigates to /login', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const loginButton = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(loginButton);

    expect(mockedNavigate).toHaveBeenCalledWith('/login');
  });

  test('clicking "Learn More" navigates to /about', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    const learnMoreButton = screen.getByRole('button', { name: /Learn More/i });
    fireEvent.click(learnMoreButton);

    expect(mockedNavigate).toHaveBeenCalledWith('/about');
  });

});
