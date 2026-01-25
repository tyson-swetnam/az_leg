import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { Home } from '@/pages/Home';
import { DistrictDetail } from '@/pages/DistrictDetail';
import { PartyNetwork } from '@/pages/PartyNetwork';
import { CommitteeNetwork } from '@/pages/CommitteeNetwork';
import { NotFound } from '@/pages/NotFound';

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/az_leg">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="district/:id" element={<DistrictDetail />} />
            <Route path="party-network" element={<PartyNetwork />} />
            <Route path="committee-network" element={<CommitteeNetwork />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
