"use client"

import { useRef, useState } from "react"
import gsap from 'gsap'
import { useTheme } from "next-themes"

const ThemeSwitch = () => {
    
    const { setTheme } = useTheme()
    
    const divRef = useRef(null)
    const [isDark, setIsDark] = useState(false)


    const rotateSwitch = () => {
        const newRotation = isDark ? 0 : 180
        const newTheme = isDark ? "light" : "dark"

        gsap.to(divRef.current, {
            rotation: newRotation,
            duration: 0.5,
            ease: "power2.inOut"
        })

        setTheme(newTheme)
        setIsDark(!isDark)
    }

  return (
    <button className='flex border-[1px] border-gray-800 dark:border-gray-200 w-[30px] h-[30px] rounded-full overflow-hidden cursor-pointer' onClick={rotateSwitch} ref={divRef}>
        <div className='w-1/2 bg-black h-full'></div>
        <div className='w-1/2 bg-white h-full'></div>
    </button>
  )
}

export default ThemeSwitch