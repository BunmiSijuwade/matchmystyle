// Single source of truth for the homepage aesthetics.
// Edit copy, swap images, or add an aesthetic here. Every section reads from this list.

export type Aesthetic = {
  slug: string;
  name: string;
  hood: string;
  line: string;
  tags: string[];
  photo: string;
  photoAlt: string;
  /** CSS object-position, keeps faces in frame when the photo is cropped */
  photoPosition: string;
  flatLay: string;
  flatLayCaption: string;
  /** 4 hex colors pulled from the look, used in the style-mix card */
  palette: string[];
};

export const aesthetics: Aesthetic[] = [
  {
    slug: "brownstone-minimal",
    name: "Brownstone Minimal",
    hood: "Fort Greene, Brooklyn",
    line: "An oversized camel coat over black basics and wide-leg denim. Warm, simple, nothing extra.",
    tags: ["tailored", "earth tones", "tonal layers"],
    photo: "/images/home/brownstone-minimal.jpg",
    photoAlt:
      "Black woman taking a mirror selfie in a brownstone parlor, wearing an oversized camel wool coat, black top, wide-leg jeans and gold hoops.",
    photoPosition: "50% 30%",
    flatLay: "/images/home/brownstone-minimal-flatlay.jpg",
    flatLayCaption: "camel coat · black tank · wide-leg denim",
    palette: ["#B08A62", "#1A1A1A", "#9DB0C8", "#C9A55A"],
  },
  {
    slug: "downtown-uniform",
    name: "Downtown Uniform",
    hood: "Lower East Side",
    line: "Black on black, broken-in leather and silver that catches the streetlights. Built for after hours.",
    tags: ["all black", "leather", "after hours"],
    photo: "/images/home/downtown-uniform.jpg",
    photoAlt:
      "Asian woman leaning on a brick wall on a Lower East Side street at dusk, in a black leather jacket, black jeans, boots and layered silver chains.",
    photoPosition: "50% 30%",
    flatLay: "/images/home/downtown-uniform-flatlay.jpg",
    flatLayCaption: "leather jacket · washed black denim · silver",
    palette: ["#1A1A1A", "#3A3634", "#5B4636", "#B9BDC2"],
  },
  {
    slug: "off-duty-muse",
    name: "Off-Duty Muse",
    hood: "West Village",
    line: "Baggy denim, the perfect white tank and sneakers that can do twenty blocks.",
    tags: ["denim", "sneakers", "model off duty"],
    photo: "/images/home/off-duty-muse.jpg",
    photoAlt:
      "Latina woman crossing a West Village street holding an iced coffee and a cream cap, in a white tank, baggy jeans and white sneakers.",
    photoPosition: "50% 35%",
    flatLay: "/images/home/off-duty-muse-flatlay.jpg",
    flatLayCaption: "white tank · baggy denim · sneakers",
    palette: ["#FFFFFF", "#A9BCD3", "#8A5A3B", "#E9E2D3"],
  },
  {
    slug: "gallery-hours",
    name: "Gallery Hours",
    hood: "Chelsea",
    line: "An oxblood shirt-jacket, cream silk and wide black wool. One bold color, everything else quiet.",
    tags: ["bold color", "sculptural", "art-directed"],
    photo: "/images/home/gallery-hours.jpg",
    photoAlt:
      "White woman standing in a sunlit Chelsea gallery beside a large abstract painting, in an oxblood wool shirt-jacket, cream silk blouse, wide black trousers, black loafers and a silver cuff.",
    photoPosition: "40% 30%",
    flatLay: "/images/home/gallery-hours-flatlay.jpg",
    flatLayCaption: "oxblood jacket · cream silk · black wool",
    palette: ["#6B2A2A", "#EDE4D3", "#1F1D1C", "#C0C3C6"],
  },
];
