import { Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load HomePage for better initial load performance
const HomePage = lazy(() => import('./pages/HomePage'));

function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <HomePage />
      </Suspense>
    </Layout>
  );
}

export default App;
