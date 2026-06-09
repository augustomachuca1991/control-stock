import React from "react";

type ButtonVariant = "gold" | "gold-outline" | "surface";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const styles: Record<ButtonVariant, React.CSSProperties> = {
  "gold": {
    background: "#C9A84C",
    color: "#0D0D0A",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "background 0.15s",
  },
  "gold-outline": {
    background: "transparent",
    color: "#C9A84C",
    border: "1px solid #C9A84C",
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "background 0.15s",
  },
  "surface": {
    background: "var(--clr-primary-dim)",
    color: "var(--clr-primary-text)",
    border: "1px solid var(--clr-border-strong)",
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "background 0.15s",
  },
};

const sizes: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "6px 14px", fontSize: 12, borderRadius: 6 },
  md: { padding: "9px 18px", fontSize: 13, borderRadius: 8 },
  lg: { padding: "12px 24px", fontSize: 15, borderRadius: 10 },
};

const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  "gold":         { background: "#D4A017" },
  "gold-outline": { background: "rgba(201,168,76,0.15)" },
  "surface":      { border: "1px solid var(--clr-primary)" },
};

const disabledStyle: React.CSSProperties = {
  opacity: 0.35,
  cursor: "not-allowed",
  pointerEvents: "none",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "gold",
  size = "md",
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const [hovered, setHovered] = React.useState(false);

  const combined: React.CSSProperties = {
    ...styles[variant],
    ...sizes[size],
    ...(props.disabled ? disabledStyle : hovered ? hoverStyles[variant] : {}),
    ...style,
  };

  return (
    <button
      style={combined}
      onMouseEnter={(e) => { if (!props.disabled) { setHovered(true); onMouseEnter?.(e); } }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e); }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

/*
  USO:

  import Button from './Button'

  // Variantes
  <Button variant="gold">+ Nueva categoría</Button>
  <Button variant="gold-outline">+ Nueva categoría</Button>
  <Button variant="surface">+ Nueva categoría</Button>

  // Tamaños
  <Button variant="gold" size="sm">Pequeño</Button>
  <Button variant="gold" size="md">Mediano</Button>
  <Button variant="gold" size="lg">Grande</Button>

  // Con onClick
  <Button variant="gold" onClick={() => setOpen(true)}>+ Nueva</Button>

  // Deshabilitado
  <Button variant="gold" disabled style={{ opacity: 0.5 }}>Guardando...</Button>

  // Con ícono (lucide-react)
  import { Plus } from 'lucide-react'
  <Button variant="gold"><Plus size={14} /> Nueva categoría</Button>
*/