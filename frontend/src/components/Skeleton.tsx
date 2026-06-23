export function SkeletonItemCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-16" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/3 mb-6" />
      <div className="h-8 bg-gray-200 rounded" />
    </div>
  )
}

export function SkeletonLoanCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center animate-pulse">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="h-8 w-20 bg-gray-200 rounded-lg ml-4" />
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-7 bg-gray-200 rounded w-1/3" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex justify-between items-center py-3 animate-pulse">
      <div className="flex-1">
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-1.5" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="h-5 w-16 bg-gray-200 rounded ml-4" />
    </div>
  )
}
