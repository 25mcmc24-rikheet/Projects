import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-500 flex items-center justify-between">
        <span>© {new Date().getFullYear()} ScholarShop — built for verified students.</span>
        <span>Buy. Sell. Rent. Repeat.</span>
      </div>
    </footer>
  );
}
