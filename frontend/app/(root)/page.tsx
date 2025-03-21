"use client"

import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { NavLinks } from "../constants";
import Link from "next/link";

export default function Home() {

  function ClickMe() {
    console.log("clicked")
  }
  return (

    <div className="flex items-center justify-center h-screen space-x-4">
      <Button className="bg-red-500" onClick={ClickMe}>click</Button>
      <ModeToggle />
      {NavLinks.map((item) => (
        <div className="flex" key={item.label}>
          <Link href={item.url}>{item.label}</Link>
        </div>
      ))}
    </div>
  );
}
