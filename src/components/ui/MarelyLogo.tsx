import React from "react";

interface MarelyLogoProps {
  backgroundColor?: string;
  letterMColor?: string;
  letterEColor?: string;
  textColor?: string;
  subtitleColor?: string;
  dividerColor?: string;
  width?: string | number;
  className?: string;
  iconOnly?: boolean;
}

const MarelyLogo: React.FC<MarelyLogoProps> = ({
  backgroundColor = "transparent",
  letterMColor = "#C9A84C",
  letterEColor = "#F0E8D0",
  textColor = "#F0E8D0",
  subtitleColor = "#888888",
  dividerColor = "#444444",
  width = "100%",
  className,
  iconOnly,
}) => {
  if (iconOnly) {
    return (
      <svg
        width={width}
        viewBox="0 0 54 48"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ display: "block" }}
      >
        <title>ME</title>
        {backgroundColor !== "transparent" && (
          <rect width="54" height="48" fill={backgroundColor} rx="8" />
        )}
        <text
          x="0" y="38"
          fontFamily="'Playfair Display', 'Times New Roman', serif"
          fontSize="40"
          fontWeight="900"
          fill={letterMColor}
        >M</text>
        <text
          x="28" y="38"
          fontFamily="'Playfair Display', 'Times New Roman', serif"
          fontSize="40"
          fontWeight="900"
          fill={letterEColor}
        >E</text>
      </svg>
    )
  }

  return (
    <svg
      width={width}
      viewBox="0 0 220 48"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", maxWidth: "100%" }}
    >
      <title>Marely Librería y Papelería</title>
      <desc>Logo Marely — iniciales ME con nombre y subtítulo</desc>

      {backgroundColor !== "transparent" && (
        <rect width="220" height="48" fill={backgroundColor} />
      )}

      <text
        x="0" y="38"
        fontFamily="'Playfair Display', 'Times New Roman', serif"
        fontSize="40"
        fontWeight="900"
        fill={letterMColor}
      >M</text>

      <text
        x="28" y="38"
        fontFamily="'Playfair Display', 'Times New Roman', serif"
        fontSize="40"
        fontWeight="900"
        fill={letterEColor}
      >E</text>

      <line x1="68" y1="6" x2="68" y2="44" stroke={dividerColor} strokeWidth="0.8" />

      <text
        x="78" y="26"
        fontFamily="'Playfair Display', 'Times New Roman', serif"
        fontSize="15"
        fontWeight="700"
        fill={textColor}
        letterSpacing="3"
      >MARELY</text>

      <text
        x="79" y="40"
        fontFamily="'Cormorant Garamond', 'Georgia', serif"
        fontSize="9"
        fontWeight="300"
        fill={subtitleColor}
        letterSpacing="2"
      >LIBRERÍA &amp; PAPELERÍA</text>
    </svg>
  );
};

export default MarelyLogo;