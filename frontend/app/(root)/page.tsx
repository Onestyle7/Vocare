"use client"

import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { NavLinks } from "../constants";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/auth";

export default function Home() {

  const router = useRouter();

  const handleLogout = () => {
    logoutUser();
    router.push("/sign-in"); // przekierowanie po wylogowaniu
  };

  return (

    <div className="flex items-center justify-center h-screen space-x-4">
      <Button className="bg-red-500" onClick={handleLogout}>Log Out</Button>
      <ModeToggle />
      {NavLinks.map((item) => (
        <div className="flex" key={item.label}>
          <Link href={item.url}>{item.label}</Link>
        </div>
      ))}
    </div>
  );
}
