import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InvestigatorDashboard from '../pages/InvestigatorDashboard';
import API from '../api/axios';
import { act } from 'react';

jest.mock('../components/InvestigatorNavbar', () => () => (
  <div data-testid="mock-navbar">Investigator Navbar</div>
));

jest.mock('../api/axios', () => ({
  get: jest.fn(),
  patch: jest.fn(),
}));

const mockReports = [
  {
    _id: '1',
    domain: 'pending.com',
    createdAt: new Date().toISOString(),
    analyzed: true,
    investigatorDecision: null,
    analysis: {
      domain: 'pending.com',
      scannedAt: new Date().toISOString(),
      riskScore: 80,
      title: 'Suspicious Site',
      malwareDetected: true,
      summary: 'Contains suspicious scripts',
      ip: '123.123.123.123',
      registrar: 'Example Registrar',
      sslValid: false,
      whoisOwner: 'Unknown',
    },
  },
  {
    _id: '2',
    domain: 'safe.com',
    createdAt: new Date().toISOString(),
    analyzed: true,
    investigatorDecision: 'benign',
    analysis: {
      domain: 'safe.com',
      scannedAt: new Date().toISOString(),
      riskScore: 10,
      title: 'Safe Site',
      malwareDetected: false,
      summary: 'No threats detected',
      ip: '111.111.111.111',
      registrar: 'Safe Registrar',
      sslValid: true,
      whoisOwner: 'John Doe',
    },
  },
];

describe('InvestigatorDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    API.get.mockResolvedValue({ data: mockReports });
    API.patch.mockResolvedValue({});
  });

  test('renders pending and completed reports', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <InvestigatorDashboard />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Reports Awaiting Review/i)).toBeInTheDocument();
    expect(screen.getByText(/Reviewed Reports/i)).toBeInTheDocument();

    expect(screen.getByText('pending.com')).toBeInTheDocument();
    expect(screen.getByText('safe.com')).toBeInTheDocument();
  });

  test('opens and closes the modal', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <InvestigatorDashboard />
        </MemoryRouter>
      );
    });

    fireEvent.click(screen.getAllByText(/View Report/i)[0]);

    expect(screen.getByText(/Analysis for pending.com/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Close/i));
    await waitFor(() =>
      expect(
        screen.queryByText(/Analysis for pending.com/i)
      ).not.toBeInTheDocument()
    );
  });

  test('handles verdict marking as malicious', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <InvestigatorDashboard />
        </MemoryRouter>
      );
    });

    fireEvent.click(screen.getByText(/View Report/i));
    fireEvent.click(screen.getByText(/Mark as Malicious/i));

    await waitFor(() => {
      expect(API.patch).toHaveBeenCalledWith('/report/1/decision', {
        verdict: 'malicious',
      });
    });
  });
});