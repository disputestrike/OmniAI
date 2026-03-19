export default function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen" style={{ background: "#09090b" }}>
      {/* Sidebar skeleton */}
      <div className="w-60 shrink-0 border-r p-3 flex flex-col gap-3" style={{ background: "#0c0c0e", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="h-14 flex items-center gap-2.5 px-2 border-b mb-1" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="skeleton w-8 h-8 rounded-xl" />
          <div className="skeleton h-4 w-20 rounded" />
        </div>
        {[1,2,3,4,5,6,7].map(i => (
          <div key={i} className="skeleton h-9 rounded-lg w-full" />
        ))}
        <div className="mt-4 space-y-1.5">
          <div className="skeleton h-3 w-16 rounded mb-2" />
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-8 rounded-lg w-full" />)}
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 p-7 space-y-5">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="skeleton h-64 rounded-2xl w-full" />
        <div className="grid grid-cols-2 gap-4">
          <div className="skeleton h-40 rounded-2xl" />
          <div className="skeleton h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
