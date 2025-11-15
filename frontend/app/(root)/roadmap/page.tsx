// app/roadmap/page.tsx
import { react } from "@/app/constants";
import { InfiniteDotCanvas } from "@/components/dot-bg";
import RoadmapBoard from "@/components/RoadmapComponents/RoadmapBoard";
import React from "react";

const defaultTiles = [
  {
    id: "react-basics",
    title: "React",
    description: "Naucz się Reacta",
    imageUrl: react,
    className: "bg-[#e5f3fa]",
    initialX: -150,
    initialY: -150,
  },
  {
    id: "react-advanced",
    title: "React",
    description: "Naucz się Reacta",
    imageUrl: react,
    className: "bg-[#e5f3fa]",
    initialX: 120,
    initialY: -100,
  },
];

const Roadmap = () => {
  return (
    <div className="h-screen w-full bg-white font-poppins">
      <InfiniteDotCanvas dotColor="#d4d4d4" gap={30} dotSize={1}>
        <RoadmapBoard initialTiles={defaultTiles} />
      </InfiniteDotCanvas>
    </div>
  );
};

export default Roadmap;
