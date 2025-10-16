import { render, screen } from "@testing-library/react";
import ResolvedReportsPage from "@/app/investigator/resolved/page";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("ResolvedReportsPage", () => {
  beforeEach(() => {
    Storage.prototype.getItem = jest.fn(() =>
      JSON.stringify({ username: "Investigator" })
    );
    usePathname.mockReturnValue("/investigator/resolved");
  });

  it("renders without crashing", () => {
    render(<ResolvedReportsPage />);
  });

  it("displays the heading 'Resolved Reports'", () => {
    render(<ResolvedReportsPage />);
    expect(screen.getByText("Resolved Reports")).toBeInTheDocument();
  });

  it("shows the UserGreeting with the username", () => {
    render(<ResolvedReportsPage />);
    expect(screen.getByText("Hello, Investigator")).toBeInTheDocument();
  });
});
