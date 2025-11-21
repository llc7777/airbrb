import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrowserRouter } from "react-router-dom";
import App from "../App";

// Helper function to generate unique email for each test run
const generateUniqueEmail = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `testuser${timestamp}${random}@example.com`;
};

describe("Happy Path - Admin User Flow", () => {
  /**
   * Complete happy path test flow:
   * 1. Register a new user
   * 2. Create a new listing
   * 3. Update listing title and thumbnail
   * 4. Publish the listing
   * 5. Unpublish the listing
   * 6. Make a booking (republish first)
   * 7. Logout
   * 8. Login back in
   */
  it("completes the full admin user flow successfully", async () => {
    localStorage.clear();
    // Generate unique credentials and listing title
    const uniqueId = Date.now();
    const hostEmail = generateUniqueEmail();
    const hostPassword = "hostPassword123!";
    const guestEmail = generateUniqueEmail();
    const guestPassword = "guestPassword123!";
    const uniqueListingTitle = `Test Beach House ${uniqueId}`;
    const updatedListingTitle = `Updated Beach House ${uniqueId}`;

    // Render app
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // ===== Step 1: Register successfully =====
    await waitFor(() => {
      expect(screen.getByText(/airbrb/i)).toBeInTheDocument();
    });

    const registerButton = screen.getByRole("button", { name: /register/i });
    await fireEvent.click(registerButton);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /register/i })
      ).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await fireEvent.change(nameInput, { target: { value: "Test User" } });
    await fireEvent.change(emailInput, { target: { value: hostEmail } });
    await fireEvent.change(passwordInput, { target: { value: hostPassword } });
    await fireEvent.change(confirmPasswordInput, {
      target: { value: hostPassword },
    });

    const submitRegisterButton = screen.getByRole("button", {
      name: /register/i,
    });
    await fireEvent.click(submitRegisterButton);

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /my hosting/i })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // ===== Step 2: Create a new listing successfully =====
    const myHostingButton = screen.getByRole("button", {
      name: /my hosting/i,
    });
    await fireEvent.click(myHostingButton);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /my hosted listings/i })
      ).toBeInTheDocument();
    });

    const createButton = screen.getByRole("button", {
      name: /create listing/i,
    });
    await fireEvent.click(createButton);

    // Wait for create listing form to load
    await waitFor(
      () => {
        expect(screen.getByLabelText(/listing title/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const titleInput = screen.getByLabelText(/listing title/i);
    const priceInput = screen.getByLabelText(/price per night/i);
    const propertyType = screen.getByLabelText(/property type/i);
    const streetInput = screen.getByLabelText(/street/i);
    const cityInput = screen.getByLabelText(/city/i);
    const stateInput = screen.getByLabelText(/state/i);
    const postcodeInput = screen.getByLabelText(/postcode/i);
    const countryInput = screen.getByLabelText(/country/i);

    await fireEvent.change(titleInput, {
      target: { value: uniqueListingTitle },
    });
    await fireEvent.change(priceInput, { target: { value: "200" } });
    await fireEvent.change(propertyType, { target: { value: "House" } });
    await fireEvent.change(streetInput, { target: { value: "123 Beach St" } });
    await fireEvent.change(cityInput, { target: { value: "Sydney" } });
    await fireEvent.change(stateInput, { target: { value: "NSW" } });
    await fireEvent.change(postcodeInput, { target: { value: "2000" } });
    await fireEvent.change(countryInput, { target: { value: "Australia" } });

    const submitCreateButton = screen.getByRole("button", {
      name: /create listing/i,
    });
    await fireEvent.click(submitCreateButton);

    // Wait for the new listing to appear with Edit button
    // This takes time: API call -> redirect -> fetch listings -> render
    await waitFor(
      () => {
        expect(screen.getByText(uniqueListingTitle)).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /edit listing/i })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // ===== Step 3: Update the title and thumbnail successfully =====
    const editButton = screen.getByRole("button", { name: /edit listing/i });
    await fireEvent.click(editButton);

    // Wait for edit listing form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/listing title/i)).toBeInTheDocument();
    });

    const editTitleInput = screen.getByLabelText(/listing title/i);
    await fireEvent.change(editTitleInput, {
      target: { value: updatedListingTitle },
    });

    // Submit the form (not just click the button) cause it's prevented
    const editForm = editTitleInput.closest("form");
    await fireEvent.submit(editForm);

    // Wait for navigation back to hosted listings and updated title to appear
    await waitFor(
      () => {
        expect(screen.getByText(/updated beach house/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // ===== Step 4: Publish the listing successfully =====
    const publishButton = screen.getByRole("button", { name: /publish/i });
    await fireEvent.click(publishButton);

    const startDateInputs = screen.getAllByLabelText(/start date/i);
    const endDateInputs = screen.getAllByLabelText(/end date/i);

    await fireEvent.change(startDateInputs[0], {
      target: { value: "2024-06-01" },
    });
    await fireEvent.change(endDateInputs[0], {
      target: { value: "2024-12-31" },
    });

    const confirmPublishButton = screen.getByRole("button", {
      name: /publish listing/i,
    });
    await fireEvent.click(confirmPublishButton);

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /unpublish/i })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // ===== Step 5: Unpublish the listing successfully =====
    const unpublishButton = screen.getByRole("button", { name: /unpublish/i });
    await fireEvent.click(unpublishButton);

    await waitFor(
      () => {
        expect(
          screen.queryByRole("button", { name: /unpublish/i })
        ).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // ===== Step 6: Make a booking (republish first) =====
    const republishButton = screen.getByRole("button", { name: /publish/i });
    await fireEvent.click(republishButton);

    const startDateInputs2 = screen.getAllByLabelText(/start date/i);
    const endDateInputs2 = screen.getAllByLabelText(/end date/i);

    await fireEvent.change(startDateInputs2[0], {
      target: { value: "2024-06-01" },
    });
    await fireEvent.change(endDateInputs2[0], {
      target: { value: "2024-12-31" },
    });

    const confirmPublishButton2 = screen.getByRole("button", {
      name: /publish listing/i,
    });
    await fireEvent.click(confirmPublishButton2);

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /unpublish/i })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Logout as host
    const hostLogoutButton = screen.getByRole("button", { name: /logout/i });
    await fireEvent.click(hostLogoutButton);

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /login/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Register as guest user
    const guestRegisterButton = screen.getByRole("button", {
      name: /register/i,
    });
    await fireEvent.click(guestRegisterButton);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /register/i })
      ).toBeInTheDocument();
    });

    const guestNameInput = screen.getByLabelText(/name/i);
    const guestEmailInput = screen.getByLabelText(/email/i);
    const guestPasswordInput = screen.getByLabelText(/^password$/i);
    const guestConfirmPasswordInput =
      screen.getByLabelText(/confirm password/i);

    await fireEvent.change(guestNameInput, { target: { value: "Guest User" } });
    await fireEvent.change(guestEmailInput, { target: { value: guestEmail } });
    await fireEvent.change(guestPasswordInput, {
      target: { value: guestPassword },
    });
    await fireEvent.change(guestConfirmPasswordInput, {
      target: { value: guestPassword },
    });

    const submitGuestRegisterButton = screen.getByRole("button", {
      name: /register/i,
    });
    await fireEvent.click(submitGuestRegisterButton);

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /logout/i })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Find and click on the published listing
    await waitFor(
      () => {
        expect(screen.getByText(updatedListingTitle)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const listingCard = screen.getByText(updatedListingTitle);
    await fireEvent.click(listingCard);

    // Make a booking
    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /book now/i })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    const bookNowButton = screen.getByRole("button", { name: /book now/i });
    await fireEvent.click(bookNowButton);

    // Fill in booking dates
    await waitFor(() => {
      expect(screen.getByLabelText(/check-in date/i)).toBeInTheDocument();
    });

    const checkInInput = screen.getByLabelText(/check-in date/i);
    const checkOutInput = screen.getByLabelText(/check-out date/i);

    await fireEvent.change(checkInInput, { target: { value: "2024-07-01" } });
    await fireEvent.change(checkOutInput, { target: { value: "2024-07-10" } });

    const confirmBookingButton = screen.getByRole("button", {
      name: /confirm booking/i,
    });
    await fireEvent.click(confirmBookingButton);

    await waitFor(
      () => {
        expect(screen.getByText(/booking confirmed/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // ===== Step 7: Log out as a guest =====
    // Wait for the page to settle after booking confirmation
    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /logout/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const logoutButton = screen.getByRole("button", { name: /logout/i });
    await fireEvent.click(logoutButton);

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /login/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // ===== Step 8: Verify host can login again =====
    const loginButton = screen.getByRole("button", { name: /login/i });
    await fireEvent.click(loginButton);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /login/i })
      ).toBeInTheDocument();
    });

    const loginEmailInput = screen.getByLabelText(/email/i);
    const loginPasswordInput = screen.getByLabelText(/password/i);

    await fireEvent.change(loginEmailInput, { target: { value: hostEmail } });
    await fireEvent.change(loginPasswordInput, {
      target: { value: hostPassword },
    });

    const submitLoginButton = screen.getByRole("button", { name: /login/i });
    await fireEvent.click(submitLoginButton);

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /logout/i })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }, 30000); // 30 second timeout for the entire happy path test
});
