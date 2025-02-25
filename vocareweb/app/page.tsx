import Link from "next/link";
import styles from "./Home.module.css";
import Image from "next/image";

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
          <div className={styles.navbar}>
            <div className={styles.logo}>
              <Image
                src="/images/logo.png"
                alt="logo"
                width={45}
                height={41}
                objectFit="cover"
              ></Image>
              <span>Vocare</span>
              <div className="">
                <Link href="/Home">Home</Link>
                <Link href="/Course">Course</Link>
                <Link href="/Category">Category</Link>
                <Link href="/Resources">Resources</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
