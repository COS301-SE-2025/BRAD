import { render, screen } from "@testing-library/react"
import ReporterDashboard from "@/app/reporter/dashboard/page"

// Mock child components
jest.mock("@/components/Sidebar", () => () => <div>Sidebar</div>)
jest.mock("@/components/UserGreeting", () => ({ username }) => <div>{username}</div>)
jest.mock("@/components/ReportFileCard", () => () => <div>ReportFileCard</div>)
jest.mock("@/components/ReportProgressBar", () => () => <div>ReportProgressBar</div>)
jest.mock("@/components/ReportsTreemap", () => () => <div>ReportsTreemap</div>)
jest.mock("@/components/Notification", () => () => <div>Notification</div>)

// Mock API
jest.mock("@/lib/api/axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
}))

describe("ReporterDashboard", () => {
  beforeEach(() => {
    Storage.prototype.getItem = jest.fn(() =>
      JSON.stringify({ username: "Reporter", _id: "123" })
    )
  })

  it("renders the dashboard and shows username", async () => {
    render(<ReporterDashboard />)
    expect(await screen.findByText("Reporter")).toBeInTheDocument()
    expect(screen.getByText("Sidebar")).toBeInTheDocument()
  })

  it("shows message when no reports are available", async () => {
    render(<ReporterDashboard />)
    expect(await screen.findByText("You have no reports yet.")).toBeInTheDocument()
  })

  it("renders ReportsTreemap placeholder", async () => {
    render(<ReporterDashboard />)
    expect(screen.getByText("ReportsTreemap")).toBeInTheDocument()
  })
})
