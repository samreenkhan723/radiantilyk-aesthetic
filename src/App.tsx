// Radiantilyk Aesthetic Enterprise Healthcare App
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmDialogHost } from "@/components/ui/confirm";

import Index from "./pages/Index.tsx";
import Book from "./pages/Book.tsx";
import BookingStatus from "./pages/BookingStatus.tsx";
import Services from "./pages/Services.tsx";
import ServiceDetail from "./pages/ServiceDetail.tsx";
import Everesse from "./pages/Everesse.tsx";

import FAQ from "./pages/FAQ.tsx";
import Quiz from "./pages/Quiz.tsx";
import Journal from "./pages/Journal.tsx";
import JournalPost from "./pages/JournalPost.tsx";

import { ThemeProvider } from "next-themes";

import NotFound from "./pages/NotFound.tsx";
import StaffLogin from "./pages/StaffLogin.tsx";
import OAuthConsent from "./pages/OAuthConsent.tsx";
import StaffMfa from "./pages/StaffMfa.tsx";
import StaffActivate from "./pages/StaffActivate.tsx";
import StaffForgotPassword from "./pages/StaffForgotPassword.tsx";
import StaffResetPassword from "./pages/StaffResetPassword.tsx";

import StaffLayout from "./pages/staff/StaffLayout.tsx";
// StaffDashboard removed — KPIs folded into StaffToday; /staff/dashboard redirects to /staff/today.
import StaffInbox from "./pages/staff/StaffInbox.tsx";
import StaffCalendar from "./pages/staff/StaffCalendar.tsx";
// StaffAvailability / StaffTimeOff are reached via /staff/my-schedule tabs; direct routes redirect.
import StaffTeam from "./pages/staff/StaffTeam.tsx";
import StaffPayroll from "./pages/staff/StaffPayroll.tsx";
import StaffServices from "./pages/staff/StaffServices.tsx";
import StaffInventory from "./pages/staff/StaffInventory.tsx";
import StaffInventoryBurn from "./pages/staff/StaffInventoryBurn.tsx";
// StaffConsents is reached via /staff/clinical-templates?tab=consents — direct route redirects there.
import StaffAppointmentDetail from "./pages/staff/StaffAppointmentDetail.tsx";
import StaffNewAppointment from "./pages/staff/StaffNewAppointment.tsx";
import StaffClients from "./pages/staff/StaffClients.tsx";
import StaffClientDetail from "./pages/staff/StaffClientDetail.tsx";
import ClientConsents from "./pages/ClientConsents.tsx";
import ClientIntake from "./pages/ClientIntake.tsx";
import ClientAuth from "./pages/ClientAuth.tsx";
import ClientAccount from "./pages/ClientAccount.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import Privacy from "./pages/Privacy.tsx";
import PrivacyPractices from "./pages/PrivacyPractices.tsx";
import Terms from "./pages/Terms.tsx";
import LocationPage from "./pages/LocationPage.tsx";
import Waitlist from "./pages/Waitlist.tsx";
// StaffWaitlist removed — waitlist is a tab inside StaffInbox; /staff/waitlist redirects.
import StaffReports from "./pages/staff/StaffReports.tsx";
import StaffProductivity from "./pages/staff/StaffProductivity.tsx";
import StaffTreatmentPlans from "./pages/staff/StaffTreatmentPlans.tsx";
import { AdminOnly } from "./components/staff/AdminOnly.tsx";
import { OwnerOnly } from "./components/staff/OwnerOnly.tsx";
import StaffFinances from "./pages/staff/StaffFinances.tsx";
import StaffAudit from "./pages/staff/StaffAudit.tsx";
import StaffAuditReport from "./pages/staff/StaffAuditReport.tsx";
import StaffMarketing from "./pages/staff/StaffMarketing.tsx";
import Feedback from "./pages/Feedback.tsx";
import StaffFeedback from "./pages/staff/StaffFeedback.tsx";
import PhotoUpload from "./pages/PhotoUpload.tsx";

import StaffCheckout from "./pages/staff/StaffCheckout.tsx";
import StaffTerminalSettings from "./pages/staff/StaffTerminalSettings.tsx";
import StaffPosConfig from "./pages/staff/StaffPosConfig.tsx";
import StaffToday from "./pages/staff/StaffToday.tsx";
// Pre-op / Post-op merged into one parameterized page rendered inside ClinicalTemplates tabs.
import StaffHelp from "./pages/staff/StaffHelp.tsx";
import StaffTimeClock from "./pages/staff/StaffTimeClock.tsx";
import StaffMyProfile from "./pages/staff/StaffMyProfile.tsx";
import StaffClinical from "./pages/staff/StaffClinical.tsx";
import ClinicalClient from "./pages/staff/clinical/ClinicalClient.tsx";
import GFEForm from "./pages/staff/clinical/GFEForm.tsx";
import ChartNoteEditor from "./pages/staff/clinical/ChartNoteEditor.tsx";
import { ClinicalErrorBoundary } from "./components/clinical/ClinicalErrorBoundary.tsx";
import Protocols from "./pages/staff/clinical/Protocols.tsx";
import StaffDevicePresets from "./pages/staff/StaffDevicePresets.tsx";
import StaffAdverseEvents from "./pages/staff/StaffAdverseEvents.tsx";
import VoProtocolRun from "./pages/staff/clinical/VoProtocolRun.tsx";
import ProtocolEditor from "./pages/staff/clinical/ProtocolEditor.tsx";
import ProtocolHistory from "./pages/staff/clinical/ProtocolHistory.tsx";
import EncounterEditor from "./pages/staff/clinical/EncounterEditor.tsx";
import SafetyHub from "./pages/staff/clinical/SafetyHub.tsx";
import StaffMessages from "./pages/staff/StaffMessages.tsx";
import StaffCosignQueue from "./pages/staff/StaffCosignQueue.tsx";
import StaffNoShowCharges from "./pages/staff/StaffNoShowCharges.tsx";
import StaffPerks from "./pages/staff/StaffPerks.tsx";
import StaffQuickPhrases from "./pages/staff/StaffQuickPhrases.tsx";
// StaffOutcomes is rendered inside StaffReports as a tab — direct route redirects there.
import StaffMySchedule from "./pages/staff/StaffMySchedule.tsx";
import StaffClinicalTemplates from "./pages/staff/StaffClinicalTemplates.tsx";
import StaffMarketingHub from "./pages/staff/StaffMarketingHub.tsx";
import StaffRewards from "./pages/staff/StaffRewards.tsx";
import StaffIntakeDashboard from "./pages/staff/StaffIntakeDashboard.tsx";
import MyCompliance from "./pages/staff/compliance/MyCompliance.tsx";
import ComplianceSign from "./pages/staff/compliance/ComplianceSign.tsx";
import ComplianceAdmin from "./pages/staff/compliance/ComplianceAdmin.tsx";
import StaffAdminHub from "./pages/staff/StaffAdminHub.tsx";
import StaffSmsSnippets from "./pages/staff/StaffSmsSnippets.tsx";
import StaffToxFollowup from "./pages/staff/StaffToxFollowup.tsx";
import ChartNotesIndex from "./pages/staff/clinical/ChartNotesIndex.tsx";
import GFEIndex from "./pages/staff/clinical/GFEIndex.tsx";
import StaffVendors from "./pages/staff/StaffVendors.tsx";
import StaffBreachReport from "./pages/staff/StaffBreachReport.tsx";
import StaffHipaaPolicies from "./pages/staff/StaffHipaaPolicies.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,        // 1 min — most reads don't change second-to-second
      gcTime: 5 * 60_000,       // keep cached pages warm for 5 min
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ConfirmDialogHost />
      
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/specials" element={<Navigate to="/services" replace />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/journal/:slug" element={<JournalPost />} />
          <Route path="/refer" element={<Navigate to="/account?tab=profile" replace />} />
          <Route path="/promotion" element={<Navigate to="/services" replace />} />
          <Route path="/june-specials" element={<Navigate to="/services" replace />} />
          <Route path="/pricing" element={<Navigate to="/services" replace />} />
          <Route path="/book" element={<Book />} />
          <Route path="/booking/:token" element={<BookingStatus />} />
          <Route path="/feedback/:token" element={<Feedback />} />
          <Route path="/photos/:token" element={<PhotoUpload />} />
          <Route path="/intake/:token" element={<ClientIntake />} />
          
          <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/mfa" element={<StaffMfa />} />
          <Route path="/staff/activate/:token" element={<StaffActivate />} />
          <Route path="/staff/forgot-password" element={<StaffForgotPassword />} />
          <Route path="/staff/reset-password" element={<StaffResetPassword />} />

          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<StaffToday />} />
            <Route path="dashboard" element={<Navigate to="/staff/today" replace />} />
            <Route path="today" element={<StaffToday />} />
            <Route path="inbox" element={<StaffInbox />} />
            <Route path="calendar" element={<StaffCalendar />} />
            <Route path="messages" element={<StaffMessages />} />
            <Route path="availability" element={<Navigate to="/staff/my-schedule?tab=availability" replace />} />
            <Route path="time-off" element={<Navigate to="/staff/my-schedule?tab=time-off" replace />} />
            <Route path="my-schedule" element={<StaffMySchedule />} />
            <Route path="clinical-templates" element={<AdminOnly><StaffClinicalTemplates /></AdminOnly>} />
            <Route path="marketing-hub" element={<AdminOnly><StaffMarketingHub /></AdminOnly>} />
            <Route path="team" element={<AdminOnly><StaffTeam /></AdminOnly>} />
            <Route path="payroll" element={<OwnerOnly><StaffPayroll /></OwnerOnly>} />
            <Route path="services" element={<AdminOnly><StaffServices /></AdminOnly>} />
            <Route path="consents" element={<Navigate to="/staff/clinical-templates?tab=consents" replace />} />
            <Route path="inventory" element={<StaffInventory />} />
            <Route path="inventory/burn" element={<Navigate to="/staff/inventory?tab=burn" replace />} />
            <Route path="appointments/new" element={<StaffNewAppointment />} />
            <Route path="appointments/:id" element={<StaffAppointmentDetail />} />
            <Route path="clients" element={<StaffClients />} />
            <Route path="clients/:email" element={<StaffClientDetail />} />
            <Route path="waitlist" element={<Navigate to="/staff/inbox?tab=waitlist" replace />} />
            <Route path="reports" element={<AdminOnly><StaffReports /></AdminOnly>} />
            <Route path="productivity" element={<AdminOnly><StaffProductivity /></AdminOnly>} />
            <Route path="feedback" element={<StaffFeedback />} />
            <Route path="treatment-plans" element={<AdminOnly><StaffTreatmentPlans /></AdminOnly>} />
            <Route path="finances" element={<AdminOnly><StaffFinances /></AdminOnly>} />
            <Route path="audit" element={<AdminOnly><StaffAudit /></AdminOnly>} />
            <Route path="audit-report" element={<AdminOnly><StaffAuditReport /></AdminOnly>} />
            <Route path="phi-audit" element={<Navigate to="/staff/audit-report" replace />} />
            <Route path="marketing" element={<Navigate to="/staff/marketing-hub" replace />} />
            <Route path="checkout" element={<StaffCheckout />} />
            <Route path="checkout/:appointmentId" element={<StaffCheckout />} />
            <Route path="terminal" element={<AdminOnly><StaffTerminalSettings /></AdminOnly>} />
            <Route path="pos-config" element={<AdminOnly><StaffPosConfig /></AdminOnly>} />
            <Route path="post-op" element={<Navigate to="/staff/clinical-templates?tab=post-op" replace />} />
            <Route path="pre-op" element={<Navigate to="/staff/clinical-templates?tab=pre-op" replace />} />
            <Route path="help" element={<StaffHelp />} />
            <Route path="time-clock" element={<StaffTimeClock />} />
            <Route path="me" element={<StaffMyProfile />} />
            <Route path="my-profile" element={<Navigate to="/staff/me" replace />} />
            <Route path="profile" element={<Navigate to="/staff/me" replace />} />
            <Route path="schedule" element={<Navigate to="/staff/my-schedule" replace />} />
            <Route path="admin" element={<AdminOnly><StaffAdminHub /></AdminOnly>} />
            <Route path="vendors" element={<AdminOnly><StaffVendors /></AdminOnly>} />
            <Route path="breach-report" element={<StaffBreachReport />} />
            <Route path="hipaa-policies" element={<AdminOnly><StaffHipaaPolicies /></AdminOnly>} />
            <Route path="clinical" element={<StaffClinical />} />
            <Route path="clinical/notes" element={<ChartNotesIndex />} />
            <Route path="clinical/gfe" element={<GFEIndex />} />
            <Route path="clinical/cosign" element={<StaffCosignQueue />} />
            <Route path="no-show-charges" element={<AdminOnly><StaffNoShowCharges /></AdminOnly>} />
            <Route path="perks" element={<Navigate to="/staff/marketing-hub?tab=perks" replace />} />
            <Route path="rewards" element={<AdminOnly><StaffRewards /></AdminOnly>} />
            <Route path="intake-status" element={<AdminOnly><StaffIntakeDashboard /></AdminOnly>} />
            <Route path="sms-snippets" element={<AdminOnly><StaffSmsSnippets /></AdminOnly>} />
            <Route path="tox-followup" element={<AdminOnly><StaffToxFollowup /></AdminOnly>} />
            <Route path="quick-phrases" element={<Navigate to="/staff/clinical-templates?tab=quick-phrases" replace />} />
            <Route path="outcomes" element={<Navigate to="/staff/reports?tab=outcomes" replace />} />
            <Route path="clinical/clients/:email" element={<ClinicalClient />} />
            <Route path="clinical/gfe/new" element={<ClinicalErrorBoundary><GFEForm /></ClinicalErrorBoundary>} />
            <Route path="clinical/gfe/:id" element={<ClinicalErrorBoundary><GFEForm /></ClinicalErrorBoundary>} />
            <Route path="clinical/notes/new" element={<ClinicalErrorBoundary><ChartNoteEditor /></ClinicalErrorBoundary>} />
            <Route path="clinical/notes/:id" element={<ClinicalErrorBoundary><ChartNoteEditor /></ClinicalErrorBoundary>} />
            <Route path="clinical/protocols" element={<Protocols />} />
            <Route path="clinical/protocols/history/:protocolId" element={<ProtocolHistory />} />
            <Route path="clinical/protocols/:id" element={<ProtocolEditor />} />
            <Route path="clinical/encounters/new" element={<EncounterEditor />} />
            <Route path="clinical/encounters/:id" element={<EncounterEditor />} />
            <Route path="device-presets" element={<AdminOnly><StaffDevicePresets /></AdminOnly>} />
            <Route path="clinical/adverse-events" element={<StaffAdverseEvents />} />
            <Route path="clinical/safety" element={<SafetyHub />} />
            <Route path="clinical/vo/:runId" element={<VoProtocolRun />} />
            <Route path="compliance" element={<MyCompliance />} />
            <Route path="compliance/admin" element={<AdminOnly><ComplianceAdmin /></AdminOnly>} />
            <Route path="compliance/sign/:protocolId" element={<ComplianceSign />} />
          </Route>
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/account/auth" element={<ClientAuth />} />
          <Route path="/account" element={<ClientAccount />} />
          <Route path="/consents/:token" element={<ClientConsents />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/privacy-practices" element={<PrivacyPractices />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/san-jose" element={<LocationPage />} />
          <Route path="/everesse" element={<Everesse />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
