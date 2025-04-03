import React from 'react'
import Section from './Section'
import { gridTiles } from '@/app/constants'
import { Component } from './Chart'

const Brain = () => {
  return (
    <Section crosses
    customPaddings
    id="brain" 
    className='min-h-screen w-screen'>
        <div className="mb-8 md:mx-[12%] mx-4 items-start justify-center">
            <div className='flex items-center justify-center mb-8'>
                <h2 className='text-sm uppercase md:text-[10px] mt-10'>Features</h2>
            </div>
            <div className="grid md:grid-cols-2 auto-rows-[300px] border-1 bg-[#2a2e35] border-gray-700 rounded-[36px]">
                {gridTiles.map((item, i) => (
                    <div key={i} className='border-1 bg-[#0e0f11] border-gray-700 rounded-[36px] p-2 flex flex-col items-center justify-center'>
                        <h2 className='text-xl text-gray-600'>{item.name}</h2>
                        <p className='font-bold text-2xl text-blue-500'>{item.subtext}</p>
                        {item.name === "Item1" && <Component />}
                    </div>
                ))}
            </div>
        </div>
    </Section>
  )
}

export default Brain
