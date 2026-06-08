import React from "react";

interface MarelyLogoV1Props {
  backgroundColor?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  textColor?: string;
  subtitleColor?: string;
  width?: string | number;
  className?: string;
}

const MarelyLogoV1: React.FC<MarelyLogoV1Props> = ({
  backgroundColor = "transparent",
  badgeColor = "#C9A84C",
  badgeTextColor = "#0D0D0A",
  textColor = "#F0E8D0",
  subtitleColor = "#888888",
  width = "100%",
  className,
}) => {
  return (
    <svg
      width={width}
      viewBox="0 0 220 52"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block" }}
    >
      <title>Marely Librería y Papelería</title>
      <desc>Logo Marely — badge dorado ME con nombre y subtítulo</desc>

      {backgroundColor !== "transparent" && (
        <rect width="220" height="52" fill={backgroundColor} />
      )}

      <rect x="0" y="2" width="46" height="46" rx="10" fill={badgeColor} />

      <text
        x="23" y="36"
        fontFamily="'Playfair Display', 'Times New Roman', serif"
        fontSize="26"
        fontWeight="900"
        fill={badgeTextColor}
        textAnchor="middle"
      >ME</text>

      <text
        x="58" y="24"
        fontFamily="'Playfair Display', 'Times New Roman', serif"
        fontSize="15"
        fontWeight="700"
        fill={textColor}
        letterSpacing="3"
      >MARELY</text>

      <text
        x="59" y="38"
        fontFamily="'Cormorant Garamond', 'Georgia', serif"
        fontSize="9"
        fontWeight="300"
        fill={subtitleColor}
        letterSpacing="2"
      >LIBRERÍA &amp; PAPELERÍA</text>
    </svg>
  );
};

export default MarelyLogoV1;