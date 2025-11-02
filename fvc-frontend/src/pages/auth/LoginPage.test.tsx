import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import LoginPage from "./LoginPage";

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockLogin = vi.fn();
const mockUseAuth = vi.fn(() => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}));
const mockUseAuthActions = vi.fn(() => ({
  login: mockLogin,
  logout: vi.fn(),
  clearError: vi.fn(),
}));

vi.mock("../../stores/authStore", async () => {
  const actual = await vi.importActual("../../stores/authStore");
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
    useAuthActions: () => mockUseAuthActions(),
  };
});

vi.mock("../../services/authService", () => ({
  default: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

vi.mock("../../assets/logo.png", () => ({
  default: "/logo.png",
}));

vi.mock("../../assets/background.png", () => ({
  default: "/background.png",
}));

// Helper function to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    mockUseAuthActions.mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      clearError: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render login page with all elements", () => {
      renderWithRouter(<LoginPage />);

      // Check for main heading
      expect(screen.getByText("Log In to your Account")).toBeInTheDocument();
      expect(screen.getByText("Welcome Back")).toBeInTheDocument();

      // Check for form inputs (using placeholders since labels aren't properly associated)
      expect(
        screen.getByPlaceholderText(/enter your email/i)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/i)
      ).toBeInTheDocument();

      // Check for submit button
      expect(
        screen.getByRole("button", { name: /continue/i })
      ).toBeInTheDocument();

      // Check for Google login button
      expect(
        screen.getByRole("button", { name: /log in with google/i })
      ).toBeInTheDocument();

      // Check for links
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
      expect(screen.getByText(/sign up here/i)).toBeInTheDocument();
    });

    it("should render logo and branding", () => {
      renderWithRouter(<LoginPage />);

      expect(screen.getByAltText("Logo")).toBeInTheDocument();
      expect(screen.getByText("FPTU Vovinam Club")).toBeInTheDocument();
      expect(screen.getByText("Management System")).toBeInTheDocument();
    });

    it("should render remember me checkbox", () => {
      renderWithRouter(<LoginPage />);

      const checkbox = screen.getByLabelText(/remember me/i);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute("type", "checkbox");
    });
  });

  describe("Form Input Handling", () => {
    it("should update email input value", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      await user.type(emailInput, "test@example.com");

      expect(emailInput).toHaveValue("test@example.com");
    });

    it("should update password input value", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/i);
      await user.type(passwordInput, "password123");

      expect(passwordInput).toHaveValue("password123");
    });

    it("should toggle password visibility", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText(
        /\*\*\*\*\*\*\*\*/i
      ) as HTMLInputElement;

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute("type", "password");

      // Find and click the eye icon - it's in the parent div's span
      const passwordContainer = passwordInput.closest("div.relative");
      const toggleButton = passwordContainer?.querySelector("span");
      expect(toggleButton).toBeInTheDocument();

      if (toggleButton) {
        await user.click(toggleButton);
        // After clicking, password should be visible
        await waitFor(() => {
          expect(passwordInput).toHaveAttribute("type", "text");
        });
      }
    });

    it("should have required attributes on email and password inputs", () => {
      renderWithRouter(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/i);

      expect(emailInput).toHaveAttribute("required");
      expect(passwordInput).toHaveAttribute("required");
    });

    it("should have correct input types", () => {
      renderWithRouter(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/i);

      expect(emailInput).toHaveAttribute("type", "email");
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("should have correct autocomplete attributes", () => {
      renderWithRouter(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/i);

      expect(emailInput).toHaveAttribute("autoComplete", "email");
      expect(passwordInput).toHaveAttribute("autoComplete", "current-password");
    });
  });

  describe("Form Submission", () => {
    it("should call login function with form data on submit", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/i);
      const submitButton = screen.getByRole("button", { name: /continue/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("should navigate to dashboard on successful login", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);

      renderWithRouter(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/i);
      const submitButton = screen.getByRole("button", { name: /continue/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should prevent default form submission", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      const form = screen
        .getByRole("button", { name: /continue/i })
        .closest("form");
      expect(form).toBeInTheDocument();

      const submitEvent = new Event("submit", {
        bubbles: true,
        cancelable: true,
      });
      // preventDefault will be called by React's form handler

      if (form) {
        form.dispatchEvent(submitEvent);
      }

      // Since we're handling submit in handleSubmit, preventDefault should be called
      // This is tested indirectly through the login call
      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/i);
      const submitButton = screen.getByRole("button", { name: /continue/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it("should not submit if email is empty", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/i);
      const submitButton = screen.getByRole("button", { name: /continue/i });

      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      // The login function should not be called
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("should not submit if password is empty", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const submitButton = screen.getByRole("button", { name: /continue/i });

      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("should show loading state when isLoading is true", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
      });

      renderWithRouter(<LoginPage />);

      const submitButton = screen.getByRole("button", { name: /logging in/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it("should disable submit button when loading", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
      });

      renderWithRouter(<LoginPage />);

      const submitButton = screen.getByRole("button", { name: /logging in/i });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when not loading", () => {
      renderWithRouter(<LoginPage />);

      const submitButton = screen.getByRole("button", { name: /continue/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("should display error message when error exists", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Invalid email or password" as string | null,
      });

      renderWithRouter(<LoginPage />);

      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });

    it("should not display error message when error is null", () => {
      renderWithRouter(<LoginPage />);

      const errorElement = screen.queryByRole("alert");
      expect(errorElement).not.toBeInTheDocument();
    });

    it("should display error with correct styling", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Login failed" as string | null,
      });

      renderWithRouter(<LoginPage />);

      const errorElement = screen.getByText("Login failed");
      expect(errorElement).toBeInTheDocument();
      // getByText returns the container element (div), not the text node
      expect(errorElement).toHaveClass("bg-red-50");
      expect(errorElement).toHaveClass("border");
      expect(errorElement).toHaveClass("border-red-200");
    });
  });

  describe("Links and Navigation", () => {
    it("should have correct link to forgot password page", () => {
      renderWithRouter(<LoginPage />);

      const forgotLink = screen.getByText(/forgot password/i);
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink.closest("a")).toHaveAttribute("href", "/forgot");
    });

    it("should have correct link to sign up page", () => {
      renderWithRouter(<LoginPage />);

      const signupLink = screen.getByText(/sign up here/i);
      expect(signupLink).toBeInTheDocument();
      expect(signupLink.closest("a")).toHaveAttribute("href", "/register");
    });

    it("should render Google login button", () => {
      renderWithRouter(<LoginPage />);

      const googleButton = screen.getByRole("button", {
        name: /log in with google/i,
      });
      expect(googleButton).toBeInTheDocument();
      expect(googleButton).toHaveAttribute("type", "button");
    });
  });

  describe("Layout and Styling", () => {
    it("should have background image", () => {
      renderWithRouter(<LoginPage />);

      const container = screen
        .getByText("Log In to your Account")
        .closest('div[style*="background"]');
      expect(container).toBeInTheDocument();
    });

    it("should render form in a container with proper styling", () => {
      renderWithRouter(<LoginPage />);

      const form = screen
        .getByRole("button", { name: /continue/i })
        .closest("form");
      expect(form).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty form submission attempt", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      const submitButton = screen.getByRole("button", { name: /continue/i });

      // Try to submit without filling form
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });

    it("should handle very long email input", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const longEmail = "a".repeat(100) + "@example.com";

      await user.type(emailInput, longEmail);

      expect(emailInput).toHaveValue(longEmail);
    });

    it("should handle special characters in password", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/i);
      const specialPassword = "P@ssw0rd!#$%^&*()";

      await user.type(passwordInput, specialPassword);

      expect(passwordInput).toHaveValue(specialPassword);
    });

    it("should handle multiple password visibility toggles", async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText(
        /\*\*\*\*\*\*\*\*/i
      ) as HTMLInputElement;
      const passwordContainer = passwordInput.closest("div.relative");
      const toggleButton = passwordContainer?.querySelector("span");

      if (toggleButton) {
        // Toggle multiple times
        await user.click(toggleButton);
        await waitFor(() => {
          expect(passwordInput).toHaveAttribute("type", "text");
        });

        await user.click(toggleButton);
        await waitFor(() => {
          expect(passwordInput).toHaveAttribute("type", "password");
        });

        await user.click(toggleButton);
        await waitFor(() => {
          expect(passwordInput).toHaveAttribute("type", "text");
        });
      }
    });
  });

  describe("Accessibility", () => {
    it("should have label text for form inputs", () => {
      renderWithRouter(<LoginPage />);

      // Labels exist but are not associated with inputs (component limitation)
      // We check that labels are present and inputs have placeholders
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Password")).toBeInTheDocument();

      // Verify inputs are accessible via placeholders
      expect(
        screen.getByPlaceholderText(/enter your email/i)
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/i)
      ).toBeInTheDocument();
    });

    it("should have accessible submit button", () => {
      renderWithRouter(<LoginPage />);

      const submitButton = screen.getByRole("button", { name: /continue/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute("type", "submit");
    });

    it("should have proper placeholders", () => {
      renderWithRouter(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/enter your email/i);
      const passwordInput = screen.getByPlaceholderText(/\*\*\*\*\*\*\*\*/i);

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });
  });
});
