import { render, screen } from "@testing-library/react";
import PendingReportsPage from "@/app/investigator/pending/page";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("PendingReportsPage", () => {
  beforeEach(() => {
    Storage.prototype.getItem = jest.fn(() =>
      JSON.stringify({ username: "Investigator" })
    );
    usePathname.mockReturnValue("/investigator/pending");
  });

  it("renders without crashing", () => {
    render(<PendingReportsPage />);
  });

  it("displays the heading 'Pending Reports'", () => {
    render(<PendingReportsPage />);
    expect(screen.getByText("Pending Reports")).toBeInTheDocument();
  });

  it("shows the UserGreeting with the username", () => {
    render(<PendingReportsPage />);
    expect(screen.getByText("Hello, Investigator")).toBeInTheDocument();
  });
});
