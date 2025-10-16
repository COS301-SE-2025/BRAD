import { render, screen, waitFor } from "@testing-library/react"
import InvestigatorDashboard from "@/app/investigator/dashboard/page"

// Mock child components
jest.mock("@/components/Sidebar", () => () => <div>Sidebar</div>)
jest.mock("@/components/UserGreeting", () => ({ username }) => <div>{username}</div>)
jest.mock("@/components/StatCard", () => ({ title, value }) => (
  <div>{title}: {value}</div>
))
jest.mock("@/components/ReportDistributionChart", () => () => <div>ReportDistributionChart</div>)
jest.mock("@/components/ReportsBarChart", () => () => <div>ReportsBarChart</div>)
jest.mock("@/components/ReportsTreemap", () => () => <div>ReportsTreemap</div>)
jest.mock("@/components/TopDomains", () => () => <div>TopDomains</div>)

// Mock API calls
jest.mock("@/lib/api/stats", () => ({
  getTotalReports: jest.fn(() => Promise.resolve(10)),
  getMaliciousReports: jest.fn(() => Promise.resolve(3)),
  getSafeReports: jest.fn(() => Promise.resolve(7)),
  getRepeatedDomains: jest.fn(() => Promise.resolve(["example.com"])),
  getPendingReportsCount: jest.fn(() => Promise.resolve(1)),
  getInProgressReportsCount: jest.fn(() => Promise.resolve(2)),
  getResolvedReportsCount: jest.fn(() => Promise.resolve(5)),
  getReportsByYear: jest.fn(() => Promise.resolve([{ month: 1, count: 5 }])),
  getReportsByWeek: jest.fn(() => Promise.resolve([{ week: 1, count: 2 }])),
  getReportsByDay: jest.fn(() => Promise.resolve([{ day: 1, count: 1 }])),
}))

describe("InvestigatorDashboard", () => {
  beforeEach(() => {
    Storage.prototype.getItem = jest.fn(() =>
      JSON.stringify({ username: "Investigator" })
    )
  })

  it("renders the dashboard and shows username", async () => {
    render(<InvestigatorDashboard />)
    expect(await screen.findByText("Investigator")).toBeInTheDocument()
    expect(screen.getByText("Sidebar")).toBeInTheDocument()
  })

  it("renders the StatCards with correct titles", async () => {
  render(<InvestigatorDashboard />)
  expect(await screen.findByText("Total Reports: 10")).toBeInTheDocument()
  expect(screen.getByText("Malicious Reports: 3")).toBeInTheDocument()
  expect(screen.getByText("Safe Reports: 7")).toBeInTheDocument()
})

  it("renders chart and top domains placeholders", async () => {
    render(<InvestigatorDashboard />)
    await waitFor(() => {
      expect(screen.getByText("ReportDistributionChart")).toBeInTheDocument()
      expect(screen.getByText("ReportsBarChart")).toBeInTheDocument()
      expect(screen.getByText("ReportsTreemap")).toBeInTheDocument()
      expect(screen.getByText("TopDomains")).toBeInTheDocument()
    })
  })
})
