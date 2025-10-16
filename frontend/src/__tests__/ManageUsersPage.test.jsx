import { render, screen, fireEvent } from "@testing-library/react";
import ManageUsersPage from "@/app/admin/users/page";

// Mock child components
jest.mock("@/components/Sidebar", () => () => <div>Sidebar</div>);
jest.mock("@/components/UserGreeting", () => ({ username }) => <div>Hello, {username}</div>);
jest.mock("@/components/AddUserForm", () => ({ onAddUser }) => (
  <button onClick={() => onAddUser({ username: "newuser", email: "a@b.com" })}>
    Add User Form
  </button>
));
jest.mock("@/components/Notification", () => ({ title, children }) => (
  <div>{title}: {children}</div>
));
jest.mock("@/components/ConfirmationModal", () => () => <div>Modal</div>);

describe("ManageUsersPage - Unit Tests", () => {

  it("renders the sidebar and greeting", () => {
    render(<ManageUsersPage />);
    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByText("Hello, Admin")).toBeInTheDocument();
  });

  it("toggles modal open when AddUserForm is clicked", () => {
    render(<ManageUsersPage />);
    const addButton = screen.getByText("Add User Form");
    fireEvent.click(addButton);
    // Modal is mocked so should show "Modal" text
    expect(screen.getByText("Modal")).toBeInTheDocument();
  });

  it("updates search input value when typed into", () => {
    render(<ManageUsersPage />);
    const searchInput = screen.getByPlaceholderText("Search by username/email");
    fireEvent.change(searchInput, { target: { value: "testuser" } });
    expect(searchInput.value).toBe("testuser");
  });

});
