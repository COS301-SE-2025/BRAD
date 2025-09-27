import { render, screen, waitFor } from "@testing-library/react";
import ReportsPage from "@/app/admin/reports/page";
import API from "@/lib/api/axios";

// Mock child components to simplify tests
jest.mock("@/components/Sidebar", () => () => <div>Sidebar</div>);
jest.mock("@/components/UserGreeting", () => ({ username }) => <div>Hello, {username}</div>);
jest.mock("@/components/ReportFileCard", () => ({ report }) => <div>{report.domain}</div>);
jest.mock("@/components/Notification", () => ({ title }) => <div>{title}</div>);

// Mock API
jest.mock("@/lib/api/axios", () => ({
  get: jest.fn(),
}));

describe("ReportsPage", () => {
  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() =>
      JSON.stringify({ username: "Admin", _id: "123" })
    );
    API.get.mockResolvedValue({ data: [
      { _id: "r1", domain: "example.com", analysisStatus: "pending" }
    ]});
  });

  it("renders without crashing", async () => {
    render(<ReportsPage />);
    expect(screen.getByText("Sidebar")).toBeInTheDocument();
  });

  it("shows the UserGreeting with the username from localStorage", async () => {
    render(<ReportsPage />);
    expect(screen.getByText("Hello, Admin")).toBeInTheDocument();
  });

  it("fetches and displays report cards", async () => {
    render(<ReportsPage />);
    await waitFor(() => {
      expect(screen.getByText("example.com")).toBeInTheDocument();
    });
  });
});
