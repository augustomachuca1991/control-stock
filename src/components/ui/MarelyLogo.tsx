import React from "react";
import { useThemeStore } from "../../stores/useThemeStore";

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

const LIGHT_E = "#57534e";
const DARK_E = "#F0E8D0";

const MarelyLogo: React.FC<MarelyLogoProps> = ({
  backgroundColor = "transparent",
  letterMColor = "#C9A84C",
  letterEColor,
  textColor,
  subtitleColor = "#888888",
  dividerColor,
  width = "100%",
  className,
  iconOnly,
}) => {
  const theme = useThemeStore((s) => s.theme);

  const eColor = letterEColor ?? (theme === "light" ? LIGHT_E : DARK_E);
  const txtColor = textColor ?? (theme === "light" ? LIGHT_E : DARK_E);
  const divColor = dividerColor ?? (theme === "light" ? "#d4d4d8" : "#444444");

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
          fill={eColor}
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
        fill={eColor}
      >E</text>

      <line x1="68" y1="6" x2="68" y2="44" stroke={divColor} strokeWidth="0.8" />

      <text
        x="78" y="26"
        fontFamily="'Playfair Display', 'Times New Roman', serif"
        fontSize="15"
        fontWeight="700"
        fill={txtColor}
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
