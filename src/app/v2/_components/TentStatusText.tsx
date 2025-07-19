import React from 'react'
import { useTentRTCContext } from '../_context/TentRTCContext'

const getStatusColor = (wsStatus: string, wsLatency: number | null | undefined) => {
  if (wsStatus === "Open" && wsLatency !== null && wsLatency !== undefined) {
    if (wsLatency <= 50) return "text-green-500";
    if (wsLatency <= 100) return "text-lime-300";
    if (wsLatency <= 200) return "text-yellow-400";
    return "text-red-500";
  } else if (wsStatus === "Open") {
    return "text-gray-400";
  } else if (wsStatus === "Connecting") {
    return "text-yellow-400";
  } else {
    return "text-gray-400";
  }
}

const TentStatusText = () => {
    const { wsStatus, wsLatency } = useTentRTCContext()
    const colorClass = getStatusColor(wsStatus, wsLatency)
  return (
    <div className={colorClass}>{wsStatus}</div>
  )
}

export default TentStatusText