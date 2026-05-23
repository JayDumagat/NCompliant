import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/src/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Policies from '@/pages/Policies';
import PolicyDetail from '@/pages/PolicyDetail';
import Tasks from '@/pages/Tasks';
import Updates from '@/pages/Updates';
import Assessments from '@/pages/Assessments';
import AssessmentDetail from '@/pages/AssessmentDetail';
import Settings from '@/pages/Settings';
import TaskTemplates from '@/pages/TaskTemplates';
import Checklists from '@/pages/Checklists';
import Training from '@/pages/Training';
import Incidents from '@/pages/Incidents';
import Reports from '@/pages/Reports';
import Analytics from '@/pages/Analytics';
import Vendors from '@/pages/Vendors';
import DataManagement from '@/pages/DataManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/policies/:id" element={<PolicyDetail />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/updates" element={<Updates />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/assessments/:id" element={<AssessmentDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/templates" element={<TaskTemplates />} />
          <Route path="/checklists" element={<Checklists />} />
          <Route path="/training" element={<Training />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/data-management" element={<DataManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
