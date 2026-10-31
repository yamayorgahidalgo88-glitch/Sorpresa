---
name: Ayoub Lahmany Barber Shop
description: A dance bill screen-printed on fluorescent card, where the haircuts are the acts.
colors:
  card: "#fff200"
  pink: "#ff43b4"
  pink-screen: "#ff8fd0"
  ink: "#0a0a0a"
typography:
  display:
    fontFamily: "Archivo, Archivo Fallback, system-ui, sans-serif"
    fontSize: "min(6rem, 7.6vw)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, Archivo Fallback, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 3vw, 2.6rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.005em"
    fontVariation: "'wdth' 100"
  title:
    fontFamily: "Archivo, Archivo Fallback, system-ui, sans-serif"
    fontSize: "clamp(1.2rem, 1.8vw, 1.55rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 108"
  numeral:
    fontFamily: "Archivo, Archivo Fallback, system-ui, sans-serif"
    fontSize: "clamp(1.2rem, 1.9vw, 1.6rem)"
    fontWeight: 900
    lineHeight: 1.05
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 112"
  condensed:
    fontFamily: "Archivo, Archivo Fallback, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "0.03em"
    fontVariation: "'wdth' 68"
  body:
    fontFamily: "Archivo, Archivo Fallback, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.45
    fontVariation: "'wdth' 100"
  label:
    fontFamily: "Archivo, Archivo Fallback, system-ui, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.12em"
    fontVariation: "'wdth' 68"
rounded:
  none: "0px"
spacing:
  gutter: "clamp(16px, 3.2vw, 40px)"
  space-3: "20px"
  space-4: "32px"
  space-5: "56px"
  space-6: "96px"
components:
  button-primary:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.ink}"
    typography: "{typography.condensed}"
    rounded: "{rounded.none}"
    padding: "0 22px"
    height: "54px"
  button-primary-big:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.ink}"
    typography: "{typography.condensed}"
    rounded: "{rounded.none}"
    padding: "0 28px"
    height: "68px"
  button-line:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.condensed}"
    rounded: "{rounded.none}"
    padding: "0 22px"
    height: "54px"
  button-line-hover:
    backgroundColor: "{colors.pink-screen}"
  button-small:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "44px"
  filter-chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.condensed}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "42px"
  filter-chip-hover:
    backgroundColor: "{colors.pink-screen}"
  filter-chip-active:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.ink}"
  price-block:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.none}"
    padding: "0.18em 0.42em 0.14em"
  boxhead:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "10px 16px 8px"
  tag:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "3px 7px 2px"
  cut-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    padding: "16px 12px 16px 4px"
  cut-row-top:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.ink}"
  plate:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "20px"
---

# Design System: Ayoub Lahmany Barber Shop

## Overview

**Creative North Star: "The Dance Bill on Fluorescent Card"**

The whole surface is one screen-printed poster. Fluorescent yellow card is the paper, black is the ink, hot pink is the second pass through the screen. Services and haircuts are billed like the acts at a dance night: outlined block caps, prices in black slugs, a pink tape band struck across at an angle. The world is loud, flat, and hand-made. Grain lies over everything, solid ink boxes bleed slightly at the edges, and every tone is a halftone screen rather than a smooth blend.

Density is poster density. Very large outlined display lines take the full width, and condensed caps carry everything practical: labels, nav, buttons, table heads. Structure comes from hand-ruled black lines and ruled grids, never from cards that float. Interaction is printing: a photo is screened onto the card as halftone, ink calipers measure it, the bill re-ranks, and active choices pick up a second outline.

It is neither the black-and-gold barber-pole template nor white spa minimalism. Both are confirmed rejections in the direction contract and the build holds to them.

**Key Characteristics:**
- Three inks on fluorescent card: yellow ground, black ink, pink second stock.
- One variable family, Archivo, pushed across its width axis: expanded 125% for acts, condensed 68% for labels.
- Square corners everywhere; 3px ink rules for structure, 2px for internal division.
- Halftone dots as the only shading language, including the pink fills.
- Paper physics: fixed screen grain (multiply, 0.42) and a displacement "bleed" on solid ink.
- Motion is a print run: acts slam into register, tape and headings wipe on, the pink pass lands misregistered and settles.

## Colors

A three-ink screen print: fluorescent yellow stock, near-black ink, and one hot pink pass, with a lighter pink tint kept for interaction.

### Primary
- **Fluo Pink** (pink): the second ink. Used for the booking action (every "Reservar" control), the tape band, the active filter and chip, the top-ranked cut, the face-shape result, table group headers, and the pink layer of the halftone print. It always carries a 5px halftone dot screen over it, so it reads as printed ink rather than a flat screen color.

### Secondary
- **Screen Pink** (pink-screen): the lighter tint of the pink pass. Reserved for transient states: hover on line buttons, filters, chips, table rows, and the drop zone, and the pressed state of the mobile dock. Never a resting fill.

### Neutral
- **Fluo Card** (card): the paper. Page ground, the fill of line buttons and plates, the knock-out color inside outlined letters, and the text color on black slugs. Also set as `theme-color`.
- **Heavy Ink** (ink): all text, every rule and border, solid slugs (prices, rating, section heads, error messages), calipers, and halftone dots.

### Named Rules
**The Three Inks Rule.** A screen is card, ink, and pink. Screen Pink appears only as a state. No fourth hue, no greys: lighter values are made by a dot screen, never by a new color.

**The Printed Pink Rule.** Any flat pink fill carries the halftone screen (`radial-gradient` dots, 0.9px, rgba(10,10,10,0.17), on a 5px grid). Flat, unscreened pink is a screen color, not ink.

## Typography

**Display Font:** Archivo variable, self-hosted (wdth 62 to 125, wght 100 to 900), with a metric-adjusted Arial fallback ("Archivo Fallback").
**Body Font:** Archivo, same file.

**Character:** One family carried entirely by its width axis. Expanded black caps act as poster block letters; condensed heavy caps are the working voice of the bill; normal-width bold handles reading.

### Hierarchy
- **Display** (900, wdth 125, min(6rem, 7.6vw); 10.6vw on mobile at wdth 112; line-height 0.95): outlined block caps for the billed acts and the advisor and closing titles. Rendered as a stack: transparent fill with a thin ink stroke, a thick ink stroke underneath passed through the bleed filter, and a card stroke between them, giving the double outline.
- **Headline** (900, wdth 100, clamp(1.6rem, 3vw, 2.6rem), line-height 1): section headings set as black slugs (Precios, Dónde estamos).
- **Title** (900, wdth 108 to 112, clamp(1.2rem, 1.8vw, 1.55rem) to 2rem, line-height 1): cut names, lineup title, drop-zone title, logo name.
- **Numeral** (900, wdth 112, tabular figures): prices in the grid, face readings. Outlined rank numerals in the lineup use wdth 125 with a 2px ink stroke.
- **Condensed** (900, wdth 68, uppercase, 0.03 to 0.04em tracking): buttons, nav, filters, strapline, address lines, dock.
- **Body** (600 to 700, 17px; 16px on mobile; line-height 1.38 to 1.45): intros, cut reasons, privacy text. Measure capped between 34ch and 60ch.
- **Label** (800, wdth 68, 0.72 to 0.82rem, 0.1 to 0.12em tracking, uppercase): table heads, reading terms, tags, captions, legends.

### Named Rules
**The Width Axis Rule.** Hierarchy comes from width and stroke as much as from size: expanded (125) is for billed acts, condensed (68) is for anything a visitor operates or scans. Don't introduce a second family.

**The Outlined Act Rule.** Outlined double-stroke caps are only for billed lines and section-scale titles, at display size. Never outline body-scale text.

## Layout

A single poster column, max width 1440px, with a fluid gutter (clamp(16px, 3.2vw, 40px)). Sections are separated by large vertical gaps (96px) and opened or closed by full-width 3px ink rules. Inside sections the spacing steps are 20, 32, 56, and 96px.

The billed acts run edge to edge at viewport-scaled size, each with its price slug beside it. The prices section is a ruled table with a pink sticky side note (minmax(220px, 300px)). The advisor is two columns: a sticky plate (minmax(300px, 0.9fr)) and the ranked lineup (1.25fr).

At 1080px and below, every two-column grid collapses to one and sticky elements become static. At 760px and below the nav is hidden and replaced by a fixed bottom dock (three cells, booking cell in pink), actions stack full width, and the lineup tightens to rank, pictogram, and text, moving the try-on button inline.

## Elevation & Depth

The system is flat. There are no drop shadows, blurs, or elevation layers. Depth is printed, not lit: layers of ink overprint (multiply), outlines stack, and a fixed grain sits above everything at z-index 100. The one sanctioned use of `box-shadow` is as a drawn outline with zero offset and zero blur.

### Shadow Vocabulary
- **Second outline** (`box-shadow: 0 0 0 3px var(--card), 0 0 0 6px var(--ink)`): hover on buttons and the nav booking control, and the resting state of an active filter or chip.
- **Focus ring** (`outline: 3px solid var(--ink); outline-offset: 4px; box-shadow: 0 0 0 7px var(--pink)`): every keyboard focus.

### Named Rules
**The Second Outline Rule.** Emphasis is drawn as another ruled outline around the object, never as an offset or blurred shadow.

**The Clean Proof Rule.** The try-on result is judged without grain: the plate lifts above the grain layer (z-index 101) only while it holds a generated image.

## Shapes

Square corners throughout (0px). Borders are 3px ink for outer structure (buttons, plates, tables, filters, section rules) and 2px for internal division (table cells, tags, lineup rows, reading cells). The drop zone is the one dashed border. The only angled shapes are the pink tape (rotated -4deg, -5deg on mobile, with a torn mask edge) and the "Tu número 1" slug (rotated 2deg). Stars are the house ornament, used in the logo, tape, rating, fit scores, featured table row, and fact list bullets.

## Components

### Buttons
Heavy, ruled, and blunt.
- **Shape:** square (0px), 3px ink border.
- **Primary:** pink with halftone screen, ink condensed caps, 54px tall (68px big, 44px small), 20px arrow icon trailing.
- **Hover / Focus:** second outline appears (160ms ease-out); press scales to 0.97. Focus uses the global ring.
- **Line:** card fill, same border; hover fills with Screen Pink.
- **Disabled:** 45% opacity, no outline or press.

### Chips
- **Style:** filters and face-shape chips share one form: 42px tall, card fill, 3px ink border, condensed caps.
- **State:** the active one turns screened pink and gains the second outline; hover on inactive ones is Screen Pink; press scales to 0.96.

### Cards / Containers
- **Corner Style:** square.
- **Background:** card; the plate and price note are boxed with 3px ink; the price note is screened pink.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 3px ink outer; 2px ink between rows.
- **Internal Padding:** 20px.

### Inputs / Fields
- **Drop zone:** dashed 3px ink, 4:5 portrait, a halftone head silhouette with pulsing dashed calipers behind a black label slug; hover Screen Pink, drag-over solid pink at 1.01 scale.
- **Consent checkbox:** 30px square, 3px ink; checked fills pink and a star rotates in.
- **Error:** ink slug with card text.

### Navigation
Condensed 900 caps aligned right over a 3px rule, with the boxed masthead logo on the left. Hover draws a 3px ink underline from the left (220ms). The booking link is a screened pink box. On mobile, a fixed bottom dock with three ruled cells replaces it.

### Billed Act (signature)
An outlined display line with a black price slug beside it. Acts slam in on load: from blurred, slightly enlarged, and raised, into register (620ms ease-out, staggered 75ms). The pink tape wipes across after them.

### Section Boxhead (signature)
Section headings are black slugs with card text at headline size, ink bleed applied, wiping on left to right when they enter view (480ms). The slug is the heading itself, not a label above one.

### Lineup Row (signature)
Grid of outlined rank numeral, 112px halftone pictogram (fade drawn as a shrinking dot ramp on the sides), name with condensed detail, reason, tags and star fit, and a small line "Pruébatelo" button. Re-ranking uses FLIP (520ms ease-out). The top cut becomes a screened pink box with a rotated "Tu número 1" slug and an ink pulse.

### Halftone Plate (signature)
The visitor's photo is drawn to canvas as staggered halftone dots, with an ink pass and a pink pass multiplied over the card. The pink pass lands misregistered and settles over 700ms. Ink calipers (3px, non-scaling) with black label slugs mark forehead, cheekbones, jaw, and length. A squeegee band sweeps the plate while it prints. Before/after compare uses a 4px ink divider and ink and pink corner slugs.

## Do's and Don'ts

### Do:
- **Do** build every surface from card, ink, and pink only, with Screen Pink reserved for hover and press.
- **Do** screen every pink fill with the 5px halftone dot pattern.
- **Do** draw tone and fades as halftone ramps (dot radius shrinking), in pictograms, plates, and illustrations alike.
- **Do** divide space with 3px ink rules and ruled grids; use 2px inside tables and lists.
- **Do** set every operable control and label in condensed (wdth 68) heavy caps.
- **Do** mark hover and active with the second outline (3px card, then 3px ink).
- **Do** apply the bleed filter to solid ink slugs and the heavy stroke of outlined display type.
- **Do** keep motion physical and brief: slam (620ms), wipe (480 to 520ms), FLIP (520ms), all on cubic-bezier(0.23, 1, 0.32, 1) or (0.77, 0, 0.175, 1), and respect reduced motion.

### Don't:
- **Don't** round corners.
- **Don't** use offset, blurred, or ambient shadows; the second outline is the only `box-shadow`.
- **Don't** use smooth color gradients for shading; a gradient is only allowed as the generator of a dot screen.
- **Don't** introduce black-and-gold barber-pole styling or white spa minimalism.
- **Don't** add a second typeface or fall back to a system display face.
- **Don't** put small tracked labels or eyebrows above headings; a section heading is the black slug itself.
- **Don't** use icon fonts or text glyphs as icons; icons are inline SVG with square-capped 2.4 to 3.2 strokes.
