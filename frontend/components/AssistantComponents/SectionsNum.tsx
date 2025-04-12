import React from 'react'

const SectionsNum = ({ number, color }: { number: string, color: string }) => {
  return (
    <span color={color} className={`text-4xl md:text-6xl font-bold bg-${color}`}>
        {number}
    </span>
  )
}

export default SectionsNum