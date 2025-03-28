"use client"

import React, { useRef, useEffect } from 'react'
import { NavLinks } from '@/app/constants'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet'
import { gsap } from 'gsap'

const MobileNav = () => {
    const pathname = usePathname();
    const line1Ref = useRef(null);
    const line2Ref = useRef(null);
    const line3Ref = useRef(null);
    const [isOpen, setIsOpen] = React.useState(false);

    useEffect(() => {
        if (isOpen) {
            gsap.to(line1Ref.current, {
                rotation: 45,
                top: "50%",
                duration: 0.3,
                ease: "power2.inOut"
            });
            gsap.to(line2Ref.current, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.inOut"
            });
            gsap.to(line3Ref.current, {
                rotation: -45,
                top: "50%",
                duration: 0.3,
                ease: "power2.inOut"
            });
        } else {
            // Animacja do stanu "close"
            gsap.to(line1Ref.current, {
                rotation: 0,
                top: "35%",
                duration: 0.3,
                ease: "power2.inOut"
            });
            gsap.to(line2Ref.current, {
                opacity: 1,
                duration: 0.3,
                ease: "power2.inOut"
            });
            gsap.to(line3Ref.current, {
                rotation: 0,
                top: "65%",
                duration: 0.3,
                ease: "power2.inOut"
            });
        }
    }, [isOpen]);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <div className='flex w-full ml-4 text-2xl'>Vocare_</div>
            <SheetTrigger asChild>
                <button className='p-8 relative' aria-label='menu' onClick={() => setIsOpen(!isOpen)}>
                    <span
                        ref={line1Ref}
                        className="absolute h-0.5 w-8 bg-black dark:bg-white"
                        style={{ left: "50%", top: "35%", transform: "translate(-50%, -50%)" }}
                    ></span>
                    <span
                        ref={line2Ref}
                        className="absolute h-0.5 w-8 bg-black dark:bg-white"
                        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
                    ></span>
                    <span
                        ref={line3Ref}
                        className="absolute h-0.5 w-8 bg-black dark:bg-white"
                        style={{ left: "50%", bottom: "30%", transform: "translate(-50%, -50%)" }}
                    ></span>
                </button>
            </SheetTrigger>
            <SheetContent side='top' className='h-full'>
                <SheetTitle className='hidden'>
                    Vocare
                </SheetTitle>
                <ul className='flex flex-col space-y-4 mt-10 items-center justify-center h-full'>
                    {NavLinks.map(({ label, url }) => (
                        <li key={label}>
                            <SheetClose asChild>
                                <Link 
                                    href={url} 
                                    className={cn(
                                        "text-[18px] uppercase font-normal",
                                        pathname === url && "underline"
                                    )}
                                >
                                    {label}
                                </Link>
                            </SheetClose>
                        </li>
                    ))}
                </ul>
            </SheetContent>
        </Sheet>
    )
}

export default MobileNav