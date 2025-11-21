import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ReviewDialog from "../components/ReviewDialog";

describe("ReviewDialog Component", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    listingTitle: "Beautiful Beach House",
  };

  // Test 1: Component renders when open is true
  it("renders dialog when open is true", () => {
    render(<ReviewDialog {...defaultProps} />);

    // Check if dialog title includes listing name
    expect(
      screen.getByText(/leave a review for beautiful beach house/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/rating/i)).toBeInTheDocument();
  });

  // Test 2: Component does not render when open is false
  it("does not render when open is false", () => {
    render(<ReviewDialog {...defaultProps} open={false} />);

    // Dialog should not be visible
    expect(screen.queryByText(/leave a review/i)).not.toBeInTheDocument();
  });

  // Test 3: Rating component is interactive
  it("allows user to select a rating", async () => {
    render(<ReviewDialog {...defaultProps} />);

    // Find all star rating buttons (MUI Rating creates radio buttons)
    const ratingButtons = screen.getAllByRole("radio");

    // Click on 4-star rating (index 3, as it's 0-indexed)
    await fireEvent.click(ratingButtons[3]);

    // The 4th star should be checked
    expect(ratingButtons[3]).toBeChecked();
  });

  // Test 4: Comment text field can be filled
  it("allows user to enter a comment", async () => {
    render(<ReviewDialog {...defaultProps} />);

    const commentField = screen.getByLabelText(/comment/i);

    // Type a comment
    await fireEvent.change(commentField, {
      target: { value: "Great place to stay!" },
    });

    // Verify comment is set
    expect(commentField.value).toBe("Great place to stay!");
  });

  // Test 5: onSubmit is called with correct parameters
  it("calls onSubmit with rating and comment when submit is clicked", async () => {
    const mockOnSubmit = vi.fn();
    render(<ReviewDialog {...defaultProps} onSubmit={mockOnSubmit} />);

    // Select 5-star rating
    const ratingButtons = screen.getAllByRole("radio");
    await fireEvent.click(ratingButtons[4]); // 5th star

    // Enter comment
    const commentField = screen.getByLabelText(/comment/i);
    await fireEvent.change(commentField, {
      target: { value: "Excellent experience!" },
    });

    // Click submit button
    const submitButton = screen.getByRole("button", { name: /submit review/i });
    await fireEvent.click(submitButton);

    // Verify onSubmit was called with correct parameters
    expect(mockOnSubmit).toHaveBeenCalledWith(5, "Excellent experience!");
  });

  // Test 6: onClose is called when cancel button is clicked
  it("calls onClose when cancel button is clicked", async () => {
    const mockOnClose = vi.fn();
    render(<ReviewDialog {...defaultProps} onClose={mockOnClose} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await fireEvent.click(cancelButton);

    // Verify onClose was called
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Test 7: Submit button disabled without rating
  it("does not call onSubmit when rating is 0", async () => {
    const mockOnSubmit = vi.fn();
    render(<ReviewDialog {...defaultProps} onSubmit={mockOnSubmit} />);

    // Enter comment without rating
    const commentField = screen.getByLabelText(/comment/i);
    await fireEvent.change(commentField, {
      target: { value: "Nice place" },
    });

    // Try to submit without rating
    const submitButton = screen.getByRole("button", { name: /submit review/i });
    await fireEvent.click(submitButton);

    // onSubmit should not be called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // Test 8: Dialog displays correct listing title
  it("displays the correct listing title in the dialog", () => {
    render(<ReviewDialog {...defaultProps} listingTitle="Mountain Cabin" />);

    expect(
      screen.getByText(/leave a review for mountain cabin/i)
    ).toBeInTheDocument();
  });

  // Test 9: Comment is optional - can submit with rating only
  it("allows submission with rating but without comment", async () => {
    const mockOnSubmit = vi.fn();
    render(<ReviewDialog {...defaultProps} onSubmit={mockOnSubmit} />);

    // Select rating without comment
    const ratingButtons = screen.getAllByRole("radio");
    await fireEvent.click(ratingButtons[2]); // 3-star rating

    const submitButton = screen.getByRole("button", { name: /submit review/i });
    await fireEvent.click(submitButton);

    // Should be called with rating and empty comment
    expect(mockOnSubmit).toHaveBeenCalledWith(3, "");
  });

  // Test 10: All 5 rating levels are available
  it("renders all 5 rating stars", () => {
    render(<ReviewDialog {...defaultProps} />);

    // Should have 5 radio buttons for rating (1-5 stars)
    const ratingButtons = screen.getAllByRole("radio");
    expect(ratingButtons).toHaveLength(5);
  });

  // Test 11: Comment field is multiline
  it("comment field accepts multiline text", async () => {
    render(<ReviewDialog {...defaultProps} />);

    const commentField = screen.getByLabelText(/comment/i);
    const multilineText = "Line 1\nLine 2\nLine 3";

    await fireEvent.change(commentField, {
      target: { value: multilineText },
    });

    expect(commentField.value).toBe(multilineText);
  });
});
