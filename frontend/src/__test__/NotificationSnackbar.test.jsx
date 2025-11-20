import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotificationSnackbar from "../components/NotificationSnackbar";

describe("NotificationSnackbar Component", () => {
  // Test 1: Component renders with correct message and severity
  it("renders with success message when open is true", () => {
    const mockOnClose = vi.fn();
    render(
      <NotificationSnackbar
        open={true}
        message="Success message"
        severity="success"
        onClose={mockOnClose}
      />
    );

    // Check if the success message is displayed
    expect(screen.getByText("Success message")).toBeInTheDocument();
  });

  // Test 2: Component does not render when open is false
  it("does not render when open is false", () => {
    const mockOnClose = vi.fn();
    render(
      <NotificationSnackbar
        open={false}
        message="Hidden message"
        severity="info"
        onClose={mockOnClose}
      />
    );

    // Message should not be visible when open is false
    expect(screen.queryByText("Hidden message")).not.toBeInTheDocument();
  });

  // Test 3: Component renders with different severity levels
  it("renders with error severity styling", () => {
    const mockOnClose = vi.fn();
    render(
      <NotificationSnackbar
        open={true}
        message="Error occurred"
        severity="error"
        onClose={mockOnClose}
      />
    );

    // Check if error message is displayed
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
  });

  // Test 4: Component renders with warning severity
  it("renders with warning severity", () => {
    const mockOnClose = vi.fn();
    render(
      <NotificationSnackbar
        open={true}
        message="Warning message"
        severity="warning"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Warning message")).toBeInTheDocument();
  });

  // Test 5: onClose callback is called when close button is clicked
  it("calls onClose when close button is clicked", async () => {
    const mockOnClose = vi.fn();
    render(
      <NotificationSnackbar
        open={true}
        message="Test message"
        severity="info"
        onClose={mockOnClose}
      />
    );

    // Find and click the close button
    const closeButton = screen.getByRole("button", { name: /close/i });
    await fireEvent.click(closeButton);

    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Test 6: Component handles empty message gracefully
  it("renders with empty message", () => {
    const mockOnClose = vi.fn();
    render(
      <NotificationSnackbar
        open={true}
        message=""
        severity="info"
        onClose={mockOnClose}
      />
    );

    // Component should render even with empty message
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  // Test 7: Component displays info severity correctly
  it("renders with info severity", () => {
    const mockOnClose = vi.fn();
    render(
      <NotificationSnackbar
        open={true}
        message="Information message"
        severity="info"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Information message")).toBeInTheDocument();
  });
});
