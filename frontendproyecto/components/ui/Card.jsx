export const Card = ({ children, className = "" }) => (
  <div className={`rounded-xl border bg-white p-4 shadow ${className}`}>
    {children}
  </div>
);