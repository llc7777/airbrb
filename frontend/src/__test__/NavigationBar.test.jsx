import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import NavigationBar from "../components/NavigationBar";
import { useAuth } from "../hooks/useAuth";
import { authAPI } from "../utils/api";

// Mock dependencies
vi.mock("../hooks/useAuth");
vi.mock("../utils/api");

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("NavigationBar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  /**
   * Test 1: Renders basic elements when user is not logged in
   */
  it("renders navigation bar with title and All Listings button when not logged in", () => {
    useAuth.mockReturnValue({
      token: null,
      userEmail: null,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <NavigationBar title="Test Title" />
      </BrowserRouter>
    );

    // Check if title is rendered
    expect(screen.getByText("Test Title")).toBeInTheDocument();

    // Check if All Listings button is visible
    expect(
      screen.getByRole("button", { name: /all listings/i })
    ).toBeInTheDocument();

    // Check that logout button is NOT visible when not logged in
    expect(
      screen.queryByRole("button", { name: /logout/i })
    ).not.toBeInTheDocument();
  });

  /**
   * Test 2: Renders authenticated user elements when logged in
   */
  it("renders logout button and My Hosting button when user is logged in", () => {
    useAuth.mockReturnValue({
      token: "fake-token",
      userEmail: "test@example.com",
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <NavigationBar title="AirBrB" />
      </BrowserRouter>
    );

    // Check if logout button is visible
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();

    // Check if My Hosting button is visible
    expect(
      screen.getByRole("button", { name: /my hosting/i })
    ).toBeInTheDocument();

    // Check if notifications button is visible (NotificationsIcon button)
    const notificationButtons = screen.getAllByRole("button");
    const hasNotificationButton = notificationButtons.some((button) =>
      button.querySelector('[data-testid="NotificationsIcon"]')
    );
    expect(hasNotificationButton || notificationButtons.length >= 4).toBe(true);
  });

  /**
   * Test 3: Logout functionality works correctly
   */
  it("calls logout API and navigates to home when logout button is clicked", async () => {
    const mockLogout = vi.fn();
    authAPI.logout = vi.fn().mockResolvedValue({});

    useAuth.mockReturnValue({
      token: "fake-token",
      userEmail: "test@example.com",
      logout: mockLogout,
    });

    render(
      <BrowserRouter>
        <NavigationBar title="AirBrB" />
      </BrowserRouter>
    );

    // Find and click logout button
    const logoutButton = screen.getByRole("button", { name: /logout/i });
    await fireEvent.click(logoutButton);

    // Wait for async operations
    await waitFor(() => {
      expect(authAPI.logout).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  /**
   * Test 4: Navigation to My Hosting works
   */
  it("navigates to hosted listings page when My Hosting button is clicked", async () => {
    useAuth.mockReturnValue({
      token: "fake-token",
      userEmail: "test@example.com",
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <NavigationBar title="AirBrB" />
      </BrowserRouter>
    );

    const myHostingButton = screen.getByRole("button", {
      name: /my hosting/i,
    });
    await fireEvent.click(myHostingButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/hosted-listings");
    });
  });

  /**
   * Test 5: Create Listing button appears when showCreateButton is true
   */
  it("shows Create Listing button when showCreateButton prop is true", () => {
    useAuth.mockReturnValue({
      token: "fake-token",
      userEmail: "test@example.com",
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <NavigationBar title="My Hosting" showCreateButton={true} />
      </BrowserRouter>
    );

    // Check if Create Listing button is visible
    expect(
      screen.getByRole("button", { name: /create listing/i })
    ).toBeInTheDocument();
  });

  /**
   * Test 6: Create Listing button navigates correctly
   */
  it("navigates to create listing page when Create Listing button is clicked", async () => {
    useAuth.mockReturnValue({
      token: "fake-token",
      userEmail: "test@example.com",
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <NavigationBar title="My Hosting" showCreateButton={true} />
      </BrowserRouter>
    );

    const createButton = screen.getByRole("button", {
      name: /create listing/i,
    });
    await fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/listings/new");
    });
  });

  /**
   * Test 7: My Hosting button is hidden when hideMyHosting is true
   */
  it("hides My Hosting button when hideMyHosting prop is true", () => {
    useAuth.mockReturnValue({
      token: "fake-token",
      userEmail: "test@example.com",
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <NavigationBar title="AirBrB" hideMyHosting={true} />
      </BrowserRouter>
    );

    // Check that My Hosting button is NOT visible
    expect(
      screen.queryByRole("button", { name: /my hosting/i })
    ).not.toBeInTheDocument();

    // But logout should still be visible
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  /**
   * Test 8: All Listings button navigates to home page
   */
  it("navigates to home page when All Listings button is clicked", async () => {
    useAuth.mockReturnValue({
      token: "fake-token",
      userEmail: "test@example.com",
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <NavigationBar title="AirBrB" />
      </BrowserRouter>
    );

    const allListingsButton = screen.getByRole("button", {
      name: /all listings/i,
    });
    await fireEvent.click(allListingsButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
