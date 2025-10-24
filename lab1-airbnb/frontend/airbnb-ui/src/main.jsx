import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

const App               = lazy(()=>import('./App'));              // <- back to App
const Home              = lazy(()=>import('./pages/Home'));
const Login             = lazy(()=>import('./pages/Login'));
const Signup            = lazy(()=>import('./pages/Signup'));
const TravelerProfile   = lazy(()=>import('./pages/TravelerProfile'));
const OwnerProfile      = lazy(()=>import('./pages/OwnerProfile'));
const Search            = lazy(()=>import('./pages/Search'));
const PropertyDetails   = lazy(()=>import('./pages/PropertyDetails'));
const TravelerDashboard = lazy(()=>import('./pages/TravelerDashboard'));
const OwnerDashboard    = lazy(()=>import('./pages/OwnerDashboard'));

const Fallback = () => <div className="p-4">Loading…</div>;
const wrap = (el) => <Suspense fallback={<Fallback/>}>{el}</Suspense>;

const router = createBrowserRouter([
  {
    path: '/',
    element: wrap(<App />),                  // <- use your App shell again
    children: [
      { index: true, element: wrap(<Home />) },
      { path: 'login', element: wrap(<Login />) },
      { path: 'signup', element: wrap(<Signup />) },
      { path: 'search', element: wrap(<Search />) },
      { path: 'property/:id', element: wrap(<PropertyDetails />) },
      { path: 'traveler', element: wrap(<TravelerDashboard />) },
      { path: 'traveler/profile', element: wrap(<TravelerProfile />) },
      { path: 'owner', element: wrap(<OwnerDashboard />) },
      { path: 'owner/profile', element: wrap(<OwnerProfile />) },
      { path: '*', element: <div className="p-4">Not found</div> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<Fallback/>}>
      <RouterProvider router={router} />
    </Suspense>
  </React.StrictMode>
);
