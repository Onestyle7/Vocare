"use client";
import { createContext, useContext } from "react";

type Ctx = {
  scale: number;
  setPanEnabled: (v: boolean) => void; // pozwala wyłączyć panning gdy dragujemy kafelek
};

export const InfiniteCanvasContext = createContext<Ctx>({
  scale: 1,
  setPanEnabled: () => {},
});

export const useInfiniteCanvas = () => useContext(InfiniteCanvasContext);
