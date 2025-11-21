import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BookingDialog from "../components/BookingDialog";

describe("BookingDialog Component", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    minDate: "2024-01-01",
    maxDate: "2024-12-31",
    pricePerNight: 100,
  };

  // Test 1: Component renders when open is true
  it("renders dialog when open is true", () => {
    render(<BookingDialog {...defaultProps} />);

    // Check if dialog title is displayed
    expect(screen.getByText("Make a Booking")).toBeInTheDocument();
    expect(screen.getByLabelText(/check-in date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/check-out date/i)).toBeInTheDocument();
  });

  // Test 2: Component does not render when open is false
  it("does not render when open is false", () => {
    render(<BookingDialog {...defaultProps} open={false} />);

    // Dialog should not be visible
    expect(screen.queryByText("Make a Booking")).not.toBeInTheDocument();
  });

  // Test 3: Date input fields can be filled
  it("allows user to input check-in and check-out dates", async () => {
    render(<BookingDialog {...defaultProps} />);

    const checkInInput = screen.getByLabelText(/check-in date/i);
    const checkOutInput = screen.getByLabelText(/check-out date/i);

    // Fill in dates
    await fireEvent.change(checkInInput, { target: { value: "2024-06-01" } });
    await fireEvent.change(checkOutInput, { target: { value: "2024-06-05" } });

    // Verify dates are set
    expect(checkInInput.value).toBe("2024-06-01");
    expect(checkOutInput.value).toBe("2024-06-05");
  });

  // Test 4: Total price calculation is displayed correctly
  it("calculates and displays total price based on nights", async () => {
    render(<BookingDialog {...defaultProps} />);

    const checkInInput = screen.getByLabelText(/check-in date/i);
    const checkOutInput = screen.getByLabelText(/check-out date/i);

    // Set dates: 4 nights (June 1 to June 5)
    await fireEvent.change(checkInInput, { target: { value: "2024-06-01" } });
    await fireEvent.change(checkOutInput, { target: { value: "2024-06-05" } });

    // Wait for calculation to appear
    await waitFor(() => {
      expect(screen.getByText(/nights: 4/i)).toBeInTheDocument();
      expect(screen.getByText(/total: \$400/i)).toBeInTheDocument();
    });
  });

  // Test 5: onConfirm is called with correct parameters
  it("calls onConfirm with correct dates and price when confirmed", async () => {
    const mockOnConfirm = vi.fn();
    render(<BookingDialog {...defaultProps} onConfirm={mockOnConfirm} />);

    const checkInInput = screen.getByLabelText(/check-in date/i);
    const checkOutInput = screen.getByLabelText(/check-out date/i);

    // Fill dates
    await fireEvent.change(checkInInput, { target: { value: "2024-06-01" } });
    await fireEvent.change(checkOutInput, { target: { value: "2024-06-03" } });

    // Click confirm button
    const confirmButton = screen.getByRole("button", {
      name: /confirm booking/i,
    });
    await fireEvent.click(confirmButton);

    // Verify onConfirm was called with correct parameters
    expect(mockOnConfirm).toHaveBeenCalledWith("2024-06-01", "2024-06-03", 200);
  });

  // Test 6: onClose is called when cancel button is clicked
  it("calls onClose when cancel button is clicked", async () => {
    const mockOnClose = vi.fn();
    render(<BookingDialog {...defaultProps} onClose={mockOnClose} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await fireEvent.click(cancelButton);

    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Test 7: Date inputs respect min and max constraints
  it("sets correct min and max date attributes", () => {
    render(<BookingDialog {...defaultProps} />);

    const checkInInput = screen.getByLabelText(/check-in date/i);
    const checkOutInput = screen.getByLabelText(/check-out date/i);

    // Check min and max attributes
    expect(checkInInput).toHaveAttribute("min", "2024-01-01");
    expect(checkInInput).toHaveAttribute("max", "2024-12-31");
    expect(checkOutInput).toHaveAttribute("min", "2024-01-01");
    expect(checkOutInput).toHaveAttribute("max", "2024-12-31");
  });

  // Test 8: No price summary shown when dates are not selected
  it("does not show price summary without dates", () => {
    render(<BookingDialog {...defaultProps} />);

    // Price summary should not be visible initially
    expect(screen.queryByText(/nights:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/total:/i)).not.toBeInTheDocument();
  });

  // Test 9: Price calculation with different night counts
  it("calculates price correctly for single night", async () => {
    render(<BookingDialog {...defaultProps} />);

    const checkInInput = screen.getByLabelText(/check-in date/i);
    const checkOutInput = screen.getByLabelText(/check-out date/i);

    // Set dates: 1 night
    await fireEvent.change(checkInInput, { target: { value: "2024-06-01" } });
    await fireEvent.change(checkOutInput, { target: { value: "2024-06-02" } });

    await waitFor(() => {
      expect(screen.getByText(/nights: 1/i)).toBeInTheDocument();
      expect(screen.getByText(/total: \$100/i)).toBeInTheDocument();
    });
  });
});
