import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import Loader from './components/layout/Loader.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import ErrorBoundary from './components/layout/ErrorBoundary.jsx';

const HomePage           = lazy(() => import('./pages/HomePage.jsx'));
const ListingsPage       = lazy(() => import('./pages/ListingsPage.jsx'));
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage.jsx'));
const CreateListingPage  = lazy(() => import('./pages/CreateListingPage.jsx'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage.jsx'));
const ChatPage           = lazy(() => import('./pages/ChatPage.jsx'));
const LoginPage          = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage       = lazy(() => import('./pages/RegisterPage.jsx'));
const VerifyEmailPage    = lazy(() => import('./pages/VerifyEmailPage.jsx'));
const NotFoundPage       = lazy(() => import('./pages/NotFoundPage.jsx'));

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/listings" element={<ListingsPage />} />
              <Route path="/listings/:id" element={<ProductDetailsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify" element={<VerifyEmailPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/sell" element={<CreateListingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/chat/:conversationId" element={<ChatPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
