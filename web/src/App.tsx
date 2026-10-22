import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MarketingLayout } from "./layout";
import { HomePage } from "./pages/home";
import {
  AboutPage,
  BlogPage,
  BlogPostPage,
  CompliancePage,
  ContactPage,
  CustomersPage,
  IndustriesPage,
  Missing,
  PressPage,
  PressReleasePage,
  PrivacyPage,
  ResourcePage,
  ResourcesPage,
  SolutionsPage,
  UseCasePage,
} from "./pages/site";
import {
  AgentsPage,
  AuditPage,
  ConsoleLayout,
  DecisionsPage,
  EscalationsPage,
  EvaluationsPage,
  FinOpsPage,
  KillSwitchPage,
  OverviewPage,
  PoliciesPage,
} from "./pages/console";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route index element={<HomePage />} />
          <Route path="solutions" element={<SolutionsPage />} />
          <Route path="solutions/:slug" element={<UseCasePage />} />
          <Route path="industries" element={<IndustriesPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="resources/:slug" element={<ResourcePage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<BlogPostPage />} />
          <Route path="press" element={<PressPage />} />
          <Route path="press/:slug" element={<PressReleasePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="*" element={<Missing title="Page" />} />
        </Route>
        <Route path="console" element={<ConsoleLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="decisions" element={<DecisionsPage />} />
          <Route path="escalations" element={<EscalationsPage />} />
          <Route path="kill-switches" element={<KillSwitchPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="policies" element={<PoliciesPage />} />
          <Route path="evaluations" element={<EvaluationsPage />} />
          <Route path="finops" element={<FinOpsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
