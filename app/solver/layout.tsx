export default function SolverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-gray-50 z-50">
      {children}
    </div>
  );
} 