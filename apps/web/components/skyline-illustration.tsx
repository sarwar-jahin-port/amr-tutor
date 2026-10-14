/** Decorative, restrained skyline strip used behind the closing mission section. */
export function SkylineIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 160"
      preserveAspectRatio="none"
      className="h-28 w-full text-aqua sm:h-36"
    >
      <path
        d="M0 160V96C40 90 70 70 110 70C150 70 160 96 200 96C230 96 240 60 270 60C300 60 300 96 330 96C360 96 380 40 420 40V20C420 10 430 10 435 20V40C440 36 450 36 452 44V96C480 90 500 100 530 96C560 92 570 70 600 70C620 70 630 96 660 96C690 96 700 50 730 50C760 50 760 96 790 96C820 96 830 76 860 76C880 76 890 96 920 96C950 96 960 60 990 60C1010 60 1010 30 1030 30V12C1030 4 1038 4 1040 12V30C1044 26 1052 26 1054 32V96C1080 90 1100 100 1130 96C1160 92 1180 100 1200 96V160Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M0 160V118C30 112 60 122 90 118C120 114 130 96 160 96C190 96 195 118 225 118C255 118 265 100 295 100C325 100 330 118 360 118C390 118 400 90 430 90C460 90 465 118 495 118C525 118 535 104 565 104C595 104 600 118 630 118C660 118 670 96 700 96C730 96 735 118 765 118C795 118 805 108 835 108C865 108 870 118 900 118C930 118 935 100 965 100C995 100 1000 118 1030 118C1060 118 1070 108 1100 108C1130 108 1140 118 1170 118C1185 118 1192 118 1200 116V160Z"
        fill="currentColor"
        className="text-mint"
        fillOpacity="0.9"
      />
      <circle cx="150" cy="30" r="2" fill="currentColor" className="text-primary/40" />
      <circle cx="330" cy="18" r="1.6" fill="currentColor" className="text-primary/40" />
      <path
        d="M1060 70C1066 66 1074 66 1080 70"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-primary/40"
        fill="none"
      />
      <path
        d="M1085 74C1091 70 1099 70 1105 74"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-primary/40"
        fill="none"
      />
    </svg>
  );
}
