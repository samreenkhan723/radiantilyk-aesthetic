import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ClientIntake from "../pages/ClientIntake";
import { BrowserRouter } from "react-router-dom";
import { toast } from "sonner";

// Mock the modules
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    }
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ token: "fake-token" }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock("react-signature-canvas", () => ({
  default: () => <div data-testid="sig-canvas" />,
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";

// Stub fetch for the actual form submission
global.fetch = vi.fn();

describe("ClientIntake NPP Acknowledgement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show NPP checkbox and block submission if unchecked in checkin mode", async () => {
    // Mock the initial fetch for checkin mode
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        appointment: {
          id: "appt-1",
          client_first_name: "John",
          client_last_name: "Doe",
          start_at: new Date().toISOString(),
          status: "scheduled",
        },
        location: { name: "Clinic" },
        staff: { first_name: "Jane" },
        services: [],
        lastFull: {
          id: "last-1",
          submitted_at: new Date().toISOString(),
          allergies: [],
          current_medications: [],
          medical_history: [],
        }
      }),
    });

    // Mock subsequent fetch for submission
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(
      <BrowserRouter>
        <ClientIntake />
      </BrowserRouter>
    );

    // Wait for checkin mode to load
    await waitFor(() => {
      expect(screen.getByText(/Pre-visit check-in/i)).toBeInTheDocument();
    });

    // Check that NPP checkbox is in the document
    const nppText = screen.getByText(/Notice of Privacy Practices \(NPP\)/i);
    expect(nppText).toBeInTheDocument();

    // Select 'No changes'
    const noChangesBtn = screen.getByText("No — nothing has changed");
    fireEvent.click(noChangesBtn);

    // Click truthfulness
    const truthCheckbox = screen.getByLabelText(/remains accurate except for what I've noted above/i);
    fireEvent.click(truthCheckbox);
    
    // Try to submit without NPP
    const submitBtn = screen.getByText("Submit check-in");
    fireEvent.click(submitBtn);

    // Should toast about NPP
    expect(toast.error).toHaveBeenCalledWith("Please acknowledge the Notice of Privacy Practices (NPP).");
    vi.mocked(toast.error).mockClear();

    // Click NPP
    const nppCheckbox = screen.getByLabelText(/Notice of Privacy Practices \(NPP\)/i);
    fireEvent.click(nppCheckbox);

    // Try to submit again
    fireEvent.click(submitBtn);
    expect(toast.error).toHaveBeenCalledWith("Please acknowledge the AI Scribe consent to continue.");
    vi.mocked(toast.error).mockClear();

    // Click AI Scribe
    const aiCheckbox = screen.getByLabelText(/AI Scribe consent/i);
    fireEvent.click(aiCheckbox);

    // Type signature
    const inputSig = screen.getByPlaceholderText("First and last name");
    fireEvent.change(inputSig, { target: { value: "John Doe" } });

    // Submit for real
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2); // Initial load + POST submission
    });

    const postCall = (global.fetch as any).mock.calls.find((call: any[]) => call[1]?.method === "POST");
    expect(postCall).toBeDefined();
    
    const parsedBody = JSON.parse(postCall[1].body);
    const payload = parsedBody.payload;

    // Verify payload has npp_acknowledged: true
    expect(payload.npp_acknowledged).toBe(true);
    expect(payload.ai_scribe_consent).toBe(true);
    expect(payload.truthful_acknowledged).toBe(true);
  });
});
