// app/roadmap/page.tsx
import { react } from "@/app/constants";
import { InfiniteDotCanvas } from "@/components/dot-bg";
import DraggableTile from "@/components/RoadmapComponents/DraggableTile";
import Tile from "@/components/RoadmapComponents/Tile";
import React from "react";

const Roadmap = () => {
  return (
    <div className="h-screen w-full bg-white font-poppins">
      <InfiniteDotCanvas dotColor="#d4d4d4" gap={30} dotSize={1}>
        {/* Każdy kafelek dostaje startowe współrzędne „świata” */}
        <DraggableTile initialX={-150} initialY={-150}>
          <Tile
            title="React"
            description="Naucz się Reacta"
            imageUrl={react}
            className="bg-[#e5f3fa]"
          />
        </DraggableTile>

        <DraggableTile initialX={-150} initialY={-150}>
          <Tile
            title="React"
            description="Naucz się Reacta"
            imageUrl={react}
            className="bg-[#e5f3fa]"
          />
        </DraggableTile>
      </InfiniteDotCanvas>
    </div>
  );
};

export default Roadmap;
