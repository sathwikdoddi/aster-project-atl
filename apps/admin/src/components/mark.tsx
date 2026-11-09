export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => (
        <ellipse
          key={index}
          cx="50"
          cy="25"
          rx="6"
          ry="22"
          fill="currentColor"
          transform={`rotate(${index * 30} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="9" fill="currentColor" />
    </svg>
  );
}
