import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import UserSettingsPage from "@/app/user-settings/page"

// Mock Sidebar and ThemeToggle so they don't interfere with tests
jest.mock("@/components/Sidebar", () => () => <div>Sidebar</div>)
jest.mock("@/components/ThemeToggle", () => () => <div>ThemeToggle</div>)

// Mock updateUser API
jest.mock("@/lib/api/auth", () => ({
  updateUser: jest.fn(() => Promise.resolve({ data: { username: "testuser" } })),
}))

describe("UserSettingsPage", () => {
  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() =>
      JSON.stringify({
        username: "johndoe",
        firstname: "John",
        lastname: "Doe",
        email: "john@example.com",
      })
    )
    Storage.prototype.setItem = jest.fn()
  })

  it("renders the page and profile info", () => {
    render(<UserSettingsPage />)

    expect(screen.getByText(/Sidebar/i)).toBeInTheDocument()
    expect(screen.getByText(/ThemeToggle/i)).toBeInTheDocument()
    expect(screen.getByText(/johndoe/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText("New First Name")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("New Last Name")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("New Username")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("New Email")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Update Profile/i })).toBeInTheDocument()
  })

  it("shows message when submitting empty form", () => {
    render(<UserSettingsPage />)

    fireEvent.click(screen.getByRole("button", { name: /Update Profile/i }))

    expect(screen.getByText(/Please fill in at least one field/i)).toBeInTheDocument()
  })
})
