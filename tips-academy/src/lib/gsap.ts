"use client"

import { gsap } from "gsap"
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { useGSAP } from "@gsap/react"

// Todos los plugins de GSAP son gratuitos desde la versión 3.13.
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin)

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

export { gsap, ScrollTrigger, SplitText, useGSAP }
