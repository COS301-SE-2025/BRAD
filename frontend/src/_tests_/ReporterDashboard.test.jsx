import React from 'react';
import {render,screen,fireEvent, waitFor,} from '@testing-library/react';
import ReporterDashboard from '../pages/ReporterDashboard';
import { MemoryRouter } from 'react-router-dom';
import API from '../api/axios';
import { act } from 'react';

const mockUser = { _id: 'user123', username: 'testuser' };
beforeAll(() => {
  Storage.prototype.getItem = jest.fn(() => JSON.stringify(mockUser));
});

global.alert = jest.fn();

jest.mock('../api/axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('ReporterDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    API.get.mockResolvedValue({
      data: [
        {
          _id: 'r1',
          domain: 'example.com',
          createdAt: new Date().toISOString(),
          investigatorDecision: false,
        },
        {
          _id: 'r2',
          domain: 'resolved.com',
          createdAt: new Date().toISOString(),
          investigatorDecision: true,
          analysis: { riskScore: 80 },
        },
      ],
    });

    API.post.mockResolvedValue({
      data: { message: 'Report submitted successfully!' },
    });
  });

  test('renders and fetches reports without errors', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <ReporterDashboard />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText('example.com')).toBeInTheDocument();
      expect(screen.getByText('resolved.com')).toBeInTheDocument();
    });
  });

  test('can submit a domain', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <ReporterDashboard />
        </MemoryRouter>
      );
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter URL/i), {
      target: { value: 'malicious.com' },
    });

    const submitButton = screen.getByRole('button', { name: /^Submit$/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Report submitted successfully!');
    });
  });

  test('filters report list by status', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <ReporterDashboard />
        </MemoryRouter>
      );
    });

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Resolved' },
    });

    await waitFor(() => {
      expect(screen.getByText('resolved.com')).toBeInTheDocument();
      expect(screen.queryByText('example.com')).not.toBeInTheDocument();
    });
  });

  test('opens and closes modal with analysis', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <ReporterDashboard />
        </MemoryRouter>
      );
    });

    const viewBtn = screen.getByRole('button', { name: /View Analysis/i });
    fireEvent.click(viewBtn);

    expect(screen.getByText(/Analysis for resolved.com/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Close/i }));
    expect(screen.queryByText(/Analysis for resolved.com/i)).not.toBeInTheDocument();
  });
});
