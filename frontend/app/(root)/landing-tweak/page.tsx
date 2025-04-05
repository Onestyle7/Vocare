import HeroTweak from '@/components/HeroTweak'
import Header from '@/components/ui/Header'
import React from 'react'
import About from '../aboutVocare/page'
import WhyUs from '@/components/WhyUs'
import About2 from '@/components/About2'
import MobileFeature from '@/components/Brain'

const page = () => {
  return (
    <main>
      <Header />
      <HeroTweak />
      <About />
      <About2 />
      <MobileFeature />
      {/* <WhyUs /> */}
    </main>
  )
}

export default page