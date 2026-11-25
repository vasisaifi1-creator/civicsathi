import { Link } from 'react-router-dom';
import Logo from './Logo';

// Centered card used by login / register / password pages.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-navy-50 to-slate-50 px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 flex justify-center">
          <Link to="/" aria-label="CivicSathi - home">
            <Logo size={44} />
          </Link>
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-5 text-center text-sm text-slate-600">{footer}</p>}
      </div>
    </div>
  );
}
