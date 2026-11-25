// CivicSathi logo: a location pin containing a civic building (pediment + columns).
export default function Logo({ showText = true, light = false, size = 36, className = '' }) {
  const pin = light ? '#ffffff' : '#162d52';
  const building = light ? '#162d52' : '#ffffff';

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label={showText ? undefined : 'CivicSathi'}
    >
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
        <path
          d="M24 2C14.6 2 7 9.4 7 18.5 7 30.5 24 46 24 46s17-15.5 17-27.5C41 9.4 33.4 2 24 2z"
          fill={pin}
        />
        <path d="M24 9.5 34.5 15.5H13.5z" fill={building} />
        <rect x="15" y="17.5" width="3.4" height="9" fill={building} />
        <rect x="22.3" y="17.5" width="3.4" height="9" fill={building} />
        <rect x="29.6" y="17.5" width="3.4" height="9" fill={building} />
        <rect x="12.5" y="27.5" width="23" height="2.6" rx="1" fill="#3cc3b8" />
      </svg>
      {showText && (
        <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy-900'}`}>
          Civic<span className={light ? 'text-teal-300' : 'text-teal-600'}>Sathi</span>
        </span>
      )}
    </span>
  );
}
