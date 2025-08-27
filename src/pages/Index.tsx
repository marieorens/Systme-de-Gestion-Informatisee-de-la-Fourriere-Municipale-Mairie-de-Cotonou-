// This page redirects to the landing page

import { Navigate } from 'react-router-dom';

const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
