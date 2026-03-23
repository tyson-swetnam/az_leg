import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { NotFound } from '@/pages/NotFound';

// Lazy-load heavy pages to reduce initial bundle size
const DistrictDetail = lazy(() => import('@/pages/DistrictDetail').then(m => ({ default: m.DistrictDetail })));
const PartyNetwork = lazy(() => import('@/pages/PartyNetwork').then(m => ({ default: m.PartyNetwork })));
const CommitteeNetwork = lazy(() => import('@/pages/CommitteeNetwork').then(m => ({ default: m.CommitteeNetwork })));
const RequestToSpeak = lazy(() => import('@/pages/RequestToSpeak').then(m => ({ default: m.RequestToSpeak })));
const LocalJurisdiction = lazy(() => import('@/pages/LocalJurisdiction').then(m => ({ default: m.LocalJurisdiction })));
const LocalDistrictDetail = lazy(() => import('@/pages/LocalDistrictDetail').then(m => ({ default: m.LocalDistrictDetail })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename="/az_leg">
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading…</div>}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="district/:id" element={<DistrictDetail />} />
                <Route path="party-network" element={<PartyNetwork />} />
                <Route path="committee-network" element={<CommitteeNetwork />} />
                <Route path="request-to-speak" element={<RequestToSpeak />} />
                <Route path="local/:jurisdictionType/:jurisdictionId" element={<LocalJurisdiction />} />
                <Route path="local/:jurisdictionType/:jurisdictionId/:districtId" element={<LocalDistrictDetail />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
