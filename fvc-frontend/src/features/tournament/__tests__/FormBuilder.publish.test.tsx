import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, beforeEach, expect } from "vitest";

// Under test
import FormBuilder from "../FormBuilder";
import { API_ENDPOINTS } from "../../../config/endpoints";

// Router mocks
const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));
vi.mock("react-router-dom", async (orig) => {
  const actual: Record<string, unknown> = await (
    orig as unknown as () => Record<string, unknown>
  )();
  return {
    ...actual,
    useParams: () => ({ id: undefined }),
    useNavigate: () => navigateMock,
  };
});

// Toast mocks (hoisted-safe)
const { toastSuccess, toastError, toastWarning } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
}));
vi.mock("../../../components/common/ToastContext", () => ({
  useToast: () => ({
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
  }),
}));

// API mocks (hoisted-safe)
const { apiGet, apiPost, apiPut } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));
vi.mock("../../../services/api", () => ({
  __esModule: true,
  default: {
    get: apiGet,
    post: apiPost,
    put: apiPut,
  },
}));

function setupSuccessfulLoads() {
  // First call: competitions list
  apiGet.mockImplementationOnce(async (url: string) => {
    if (url === API_ENDPOINTS.COMPETITIONS.BASE) {
      return { data: { content: [{ id: "comp-1", name: "Comp 1" }] } };
    }
    return { data: {} };
  });

  // Second call: competition detail for selected id
  apiGet.mockImplementationOnce(async (url: string) => {
    if (url === API_ENDPOINTS.COMPETITIONS.BY_ID("comp-1")) {
      return {
        data: {
          weightClasses: [],
          vovinamFistConfigs: [],
          fistConfigItemSelections: {},
          musicPerformances: [],
        },
      };
    }
    return { data: {} };
  });

  // Publish create
  apiPost.mockResolvedValueOnce({});
}

describe("FormBuilder - Publish tournament registration form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  it("calls API with status PUBLISH and navigates back on success", async () => {
    setupSuccessfulLoads();

    render(<FormBuilder />);

    // Wait for competitions to load and default selection to be set
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith(API_ENDPOINTS.COMPETITIONS.BASE);
    });

    // Click Publish button
    const publishBtn = await screen.findByRole("button", {
      name: /Lưu & Publish/i,
    });
    await userEvent.click(publishBtn);

    // Post should be invoked with status PUBLISH
    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledTimes(1);
    });

    const [calledUrl, payload] = apiPost.mock.calls[0];
    expect(calledUrl).toBe(API_ENDPOINTS.TOURNAMENT_FORMS.BASE);
    expect(payload.status).toBe("PUBLISH");
    expect(payload.formType).toBe("COMPETITION_REGISTRATION");
    expect(payload.competitionId).toBe("comp-1");

    // Success toast displayed
    expect(toastSuccess).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it("does not publish when no competition is selected", async () => {
    setupSuccessfulLoads();

    render(<FormBuilder />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith(API_ENDPOINTS.COMPETITIONS.BASE);
    });

    // Set competition to empty
    const select = screen.getByLabelText(/Chọn Giải/i) as HTMLSelectElement;
    await userEvent.selectOptions(select, "");

    const publishBtn = await screen.findByRole("button", {
      name: /Lưu & Publish/i,
    });
    await userEvent.click(publishBtn);

    // Should not call post
    await waitFor(() => {
      expect(apiPost).not.toHaveBeenCalled();
    });
    expect(toastError).toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("shows validation error when title/description are empty", async () => {
    setupSuccessfulLoads();

    render(<FormBuilder />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith(API_ENDPOINTS.COMPETITIONS.BASE);
    });

    // Clear title and description
    const titleInput = screen.getByLabelText(/Tiêu đề \*/i) as HTMLInputElement;
    await userEvent.clear(titleInput);
    const descInput = screen.getByLabelText(/Mô tả \*/i) as HTMLTextAreaElement;
    await userEvent.clear(descInput);

    const publishBtn = await screen.findByRole("button", {
      name: /Lưu & Publish/i,
    });
    await userEvent.click(publishBtn);

    await waitFor(() => {
      expect(apiPost).not.toHaveBeenCalled();
    });
    expect(toastError).toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("includes endDate when quick-pick is used", async () => {
    setupSuccessfulLoads();

    render(<FormBuilder />);
    await waitFor(() => {
      expect(apiGet).toHaveBeenCalledWith(API_ENDPOINTS.COMPETITIONS.BASE);
    });

    // Click quick-pick tomorrow
    await userEvent.click(
      screen.getByRole("button", { name: /Ngày mai 23:59/i })
    );

    const publishBtn = await screen.findByRole("button", {
      name: /Lưu & Publish/i,
    });
    await userEvent.click(publishBtn);

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledTimes(1);
    });
    const [, payload] = apiPost.mock.calls[0];
    expect(payload.endDate).toBeTruthy();
  });

  it("shows error toast when publish API fails", async () => {
    // Loads
    apiGet.mockImplementationOnce(async (url: string) => {
      if (url === API_ENDPOINTS.COMPETITIONS.BASE) {
        return { data: { content: [{ id: "comp-1", name: "Comp 1" }] } };
      }
      return { data: {} };
    });
    apiGet.mockImplementationOnce(async (url: string) => {
      if (url === API_ENDPOINTS.COMPETITIONS.BY_ID("comp-1")) {
        return {
          data: {
            weightClasses: [],
            vovinamFistConfigs: [],
            fistConfigItemSelections: {},
            musicPerformances: [],
          },
        };
      }
      return { data: {} };
    });
    apiPost.mockRejectedValueOnce(new Error("Network error"));

    render(<FormBuilder />);

    const publishBtn = await screen.findByRole("button", {
      name: /Lưu & Publish/i,
    });
    await userEvent.click(publishBtn);

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledTimes(1);
    });
    expect(toastError).toHaveBeenCalled();
    // Should not navigate on failure
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
