import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import AdminDashboard from "@/app/admin/dashboard/page"

// === Mock API calls ===
jest.mock("@/lib/api/stats", () => ({
  getTotalReports: jest.fn(() => Promise.resolve(10)),
  getMaliciousReports: jest.fn(() => Promise.resolve(5)),
  getSafeReports: jest.fn(() => Promise.resolve(5)),
  getRepeatedDomains: jest.fn(() => Promise.resolve([])),
  getPendingReportsCount: jest.fn(() => Promise.resolve(2)),
  getInProgressReportsCount: jest.fn(() => Promise.resolve(3)),
  getResolvedReportsCount: jest.fn(() => Promise.resolve(5)),
  getReportsByYear: jest.fn(() => Promise.resolve([{ month: 1, count: 10 }])),
  getReportsByWeek: jest.fn(() => Promise.resolve([])),
  getReportsByDay: jest.fn(() => Promise.resolve([])),
  getAvgBotAnalysisTime: jest.fn(() => Promise.resolve("2h")),
  getAvgInvestigatorTime: jest.fn(() => Promise.resolve("3h")),
  getAvgResolutionTime: jest.fn(() => Promise.resolve("5h")),
  getInvestigatorStats: jest.fn(() => Promise.resolve([])),
}))

// === Mock child components ===
jest.mock("@/components/Sidebar", () => () => <div>Sidebar</div>)
jest.mock("@/components/UserGreeting", () => (props) => (
  <div>UserGreeting - {props.username}</div>
))
jest.mock("@/components/ReportsTreemap", () => () => <div>ReportsTreemap</div>)
jest.mock("@/components/ReportDistributionChart", () => () => <div>ReportDistributionChart</div>)
jest.mock("@/components/ReportsBarChart", () => () => <div>ReportsBarChart</div>)
jest.mock("@/components/TopDomains", () => () => <div>TopDomains</div>)
jest.mock("@/components/StatCard", () => (props) => (
  <div>StatCard - {props.title}: {props.value}</div>
))
jest.mock("@/components/InvestigatorStats", () => () => <div>InvestigatorStats</div>)

describe("AdminDashboard Page", () => {
  it("renders without crashing", () => {
    render(<AdminDashboard />)
    expect(screen.getByText(/Sidebar/i)).toBeInTheDocument()
  })

  it("displays the admin greeting", () => {
    render(<AdminDashboard />)
    expect(screen.getByText(/UserGreeting - Admin/i)).toBeInTheDocument()
  })
})
