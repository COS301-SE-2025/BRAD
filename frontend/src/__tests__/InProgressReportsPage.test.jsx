import { render, screen } from "@testing-library/react";
import InProgressReportsPage from "@/app/investigator/in-progress/page";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("InProgressReportsPage", () => {
  beforeEach(() => {
    Storage.prototype.getItem = jest.fn(() =>
      JSON.stringify({ username: "Investigator" })
    );
    usePathname.mockReturnValue("/investigator/in-progress");
  });

  it("renders without crashing", () => {
    render(<InProgressReportsPage />);
  });

  it("displays the heading 'In Progress Reports'", () => {
    render(<InProgressReportsPage />);
    expect(screen.getByText("In Progress Reports")).toBeInTheDocument();
  });

  it("shows the UserGreeting with the username", () => {
    render(<InProgressReportsPage />);
    expect(screen.getByText("Hello, Investigator")).toBeInTheDocument();
  });
});
