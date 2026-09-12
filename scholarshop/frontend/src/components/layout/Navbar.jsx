import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import NotificationsBell from '../notifications/NotificationsBell.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();

  const navClass = ({ isActive }) =>
    'px-3 py-1.5 text-sm rounded-md ' +
    (isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100');

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-4">
        <Link to="/" className="font-semibold text-brand-700 tracking-tight text-lg">
          ScholarShop
        </Link>

        <nav className="hidden sm:flex items-center gap-1 ml-4">
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/listings" className={navClass}>Browse</NavLink>
          {user && <NavLink to="/sell" className={navClass}>Sell / Rent</NavLink>}
          {user && <NavLink to="/chat" className={navClass}>Chats</NavLink>}
          {user && <NavLink to="/dashboard" className={navClass}>Dashboard</NavLink>}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <NotificationsBell />
              <span className="hidden md:inline text-sm text-slate-600">
                Hi, <span className="font-medium text-slate-800">{user.name.split(' ')[0]}</span>
              </span>
              <button className="btn-secondary" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Login</Link>
              <Link to="/register" className="btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
