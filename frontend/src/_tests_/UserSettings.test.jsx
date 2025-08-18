import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserSettings from '../pages/UserSettings';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mocks
jest.mock('../components/Navbar', () => () => <div data-testid="navbar">Navbar</div>);
jest.mock('../components/InvestigatorNavbar', () => () => <div data-testid="investigator-navbar">InvestigatorNavbar</div>);

describe('UserSettings', () => {
  test('renders all form inputs', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/settings']}>
        <Routes>
          <Route path="/dashboard/settings" element={<UserSettings />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText('New First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New Last Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  test('renders InvestigatorNavbar for investigator path', () => {
    render(
      <MemoryRouter initialEntries={['/investigator/settings']}>
        <Routes>
          <Route path="/investigator/settings" element={<UserSettings />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('investigator-navbar')).toBeInTheDocument();
  });

  test('shows error message if no fields are filled', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/settings']}>
        <Routes>
          <Route path="/dashboard/settings" element={<UserSettings />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    expect(screen.getByText(/please fill in at least one field/i)).toBeInTheDocument();
  });

  test('shows success message on valid update', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/settings']}>
        <Routes>
          <Route path="/dashboard/settings" element={<UserSettings />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('New First Name'), {
      target: { value: 'Alice' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

    expect(screen.getByText(/your changes have been saved/i)).toBeInTheDocument();
  });
});
