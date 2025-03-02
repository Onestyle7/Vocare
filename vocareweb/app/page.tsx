import Link from "next/link";
import styles from "./Home.module.css";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className={styles.outerContainer}>
      <div className={styles.decorativeCircleLeft}></div>
      <div className={styles.decorativeRingLeft}></div>
      <div className={styles.decorativeRingLeft2}></div>
      <div className={styles.decorativeRingLeft3}></div>
      <div className={styles.decorativeCircleRight}></div>
      <div className={styles.decorativeRingRight}></div>
      <div className={styles.decorativeRingRight2}></div>
      <div className={styles.decorativeRingRight3}></div>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className="flex justify-between items-center bg-transparent h-20 px-8 w-full">
            {/* Logo section */}
            <div className="flex items-center gap-2 font-pixel font-bold text-xl text-white">
              <Image
                src="/images/logo.png"
                alt="logo"
                width={45}
                height={41}
                objectFit="cover"
              />
              <span>Vocare</span>
            </div>

            {/* Navigation links */}
            <div className="flex gap-8">
              <Link
                href="/Home"
                className="text-white hover:text-[#ffc619] transition-colors"
              >
                Home
              </Link>
              <Link
                href="/Course"
                className="text-white hover:text-[#ffc619] transition-colors"
              >
                Course
              </Link>
              <Link
                href="/Categori"
                className="text-white hover:text-[#ffc619] transition-colors"
              >
                Category
              </Link>
              <Link
                href="/Resources"
                className="text-white hover:text-[#ffc619] transition-colors"
              >
                Resources
              </Link>
            </div>

            {/* Auth buttons */}
            <div className="flex gap-4">
              <Link href="/signin" className="text-white py-2 px-4">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-white text-black py-2 px-6 rounded-full font-medium"
              >
                Sign up
              </Link>
            </div>
          </div>
          {/* Sekcja Hero */}
          <div className="flex flex-col items-center justify-center text-center mt-20">
            {/*Nagłowek z efektem gradientu*/}
            <h1 className="text-5xl font-bold mb-4 relative">
              <span className="relative z-10">Lets Improve</span>
              <span className="relative z-10 font-normal"> your</span>
              <span className="text-white relative-10"> skills</span>
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-600 to-purple-600 opacity-20 blur-xl rounded-full -z-0"></div>
            </h1>
            <h2 className="text-5xl font-bold mb-12 text-white">with us</h2>

            {/*Subtitle*/}
            <p className="text-gray-300 mb-8 max-w-md">
              Find you best path to improve your skills and knowledge with us.
              Your career, our mission. Move forward
            </p>
            <Button className="bg-white text-black font-semibold py-3 px-8">
              Get Started
            </Button>
            {/*  <button className="bg-white text-black font-medium py-3 px-8 rounded-full hover:bg-gray-100 transition-colors text-center h-8">
              Get Started
            </button> */}
          </div>
          {/*Sekcja skills*/}
          <div
            className={`relative mb-24 w-full overflow-visible ${styles.skillWave}`}
          >
            <div className="revalitive">
              {/* Gradient tags */}
              <div
                className={`${styles.gradientTag} transform mx-2 my-1 z-10 left-[-3%] top-[30%]`}
                style={{ transform: "rotate(-13deg)" }}
              >
                Illustration
              </div>

              <div
                className={`${styles.gradientTag} transform -rotate-15 mx-2 my-1 z-10 left-[8%] top-[45%]`}
                style={{ transform: "rotate(10deg)" }}
              >
                Graphic Designer
              </div>

              <div
                className={`${styles.gradientTag} transform -rotate-10 mx-2 my-1 z-10 left-[26%] top-[50%]`}
                style={{ transform: "rotate(-22deg)" }}
              >
                Web Development
              </div>

              <div
                className={`${styles.gradientTag} transform -rotate-8 mx-2 my-1 z-10 left-[46%] top-[30%]`}
                style={{ transform: "rotate(8deg)" }}
              >
                Software Engineer
              </div>

              <div
                className={`${styles.gradientTag} transform -rotate-45 mx-2 my-1 z-10 left-[66%] top-[30%]`}
                style={{ transform: "rotate(-20deg)" }}
              >
                UI / UX
              </div>

              <div
                className={`${styles.gradientTag} transform -rotate-6 mx-2 my-1 z-10 left-[75%] top-[33%]`}
                style={{ transform: "rotate(19deg)" }}
              >
                CopyWriter
              </div>

              <div
                className={`${styles.gradientTag} transform -rotate-6 mx-2 my-1 z-10 left-[82%] top-[50%]`}
                style={{ transform: "rotate(-13deg)" }}
              >
                Product Designer
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
