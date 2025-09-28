import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import HelpPage from "@/app/help/page"

// === Mock usePathname ===
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/reporter/help"),
}))

// === Mock child components ===
jest.mock("@/components/BackButton", () => () => <div>BackButton</div>)
jest.mock("@/components/FAQ", () => (props) => (
  <div>FAQ Component - role: {props.role} - search: {props.searchTerm}</div>
))

describe("HelpPage", () => {
  it("renders the help header", () => {
    render(<HelpPage />)
    expect(screen.getByText(/Hi, how can we help/i)).toBeInTheDocument()
  })

  it("renders the BackButton and FAQ components", () => {
    render(<HelpPage />)
    expect(screen.getByText(/BackButton/i)).toBeInTheDocument()
    expect(screen.getByText(/FAQ Component/i)).toBeInTheDocument()
  })

  it("updates the search input value", () => {
    render(<HelpPage />)
    const input = screen.getByPlaceholderText(/Search FAQs.../i)
    fireEvent.change(input, { target: { value: "login" } })
    expect(input.value).toBe("login")
  })
})
