# Control de Stock y Ventas

Sistema de gestión de stock y punto de venta (POS) para **Librería MARELY**. Aplicación SPA construida con React, TypeScript y Tailwind CSS.

## Tecnologías

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| Framework | React | ^19.2.7 |
| Lenguaje | TypeScript | ~6.0.2 |
| Build | Vite | ^8.0.12 |
| Routing | react-router-dom | ^7.17.0 |
| Estado | Zustand | ^5.0.14 |
| Estilos | Tailwind CSS v4 | ^4.3.0 |
| Iconos | lucide-react | ^1.17.0 |

## Requisitos

- Node.js >= 18
- npm >= 9

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/control-stock.git
cd control-stock

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Instalar dependencias
npm install

# 4. Iniciar en desarrollo
npm run dev
```

## Variables de Entorno

Editar el archivo `.env` con la configuración del negocio:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_STORE_NAME` | Nombre del comercio | `Librería MARELY` |
| `VITE_CURRENCY_SYMBOL` | Símbolo monetario | `$` |
| `VITE_CURRENCY_CODE` | Código de moneda ISO | `ARS` |
| `VITE_PRIMARY_COLOR` | Color primario | `#4f46e5` |
| `VITE_PRIMARY_DARK` | Primario oscuro | `#4338ca` |
| `VITE_PRIMARY_LIGHT` | Primario claro | `#818cf8` |
| `VITE_PRIMARY_50` | Primario tono 50 | `#eef2ff` |
| `VITE_ACCENT_COLOR` | Color de acento | `#f59e0b` |
| `VITE_ACCENT_DARK` | Acento oscuro | `#d97706` |
| `VITE_SUCCESS_COLOR` | Color éxito | `#10b981` |
| `VITE_DANGER_COLOR` | Color peligro | `#ef4444` |
| `VITE_WARNING_COLOR` | Color advertencia | `#f59e0b` |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo en `http://localhost:5173` |
| `npm run build` | Compila TypeScript y genera build de producción en `dist/` |
| `npm run preview` | Previsualiza el build de producción localmente |

## Estructura del Proyecto

```
src/
├── main.tsx                  # Punto de entrada
├── App.tsx                   # Router y Layout
├── index.css                 # Tailwind + tema
├── config.ts                 # Config desde .env
├── types/index.ts            # Definiciones TypeScript
├── data/mockData.ts          # Datos de prueba
├── stores/                   # Estado global (Zustand)
│   ├── useCategoryStore.ts
│   ├── useProductStore.ts
│   └── useSaleStore.ts
├── components/
│   ├── layout/               # Layout, Sidebar, Header
│   └── ui/                   # Button, Card, Modal, Input, Select, Badge, Table
└── pages/                    # Vistas principales
    ├── Dashboard.tsx         # Panel de inicio
    ├── Products.tsx          # CRUD productos
    ├── Sales.tsx             # Punto de venta
    ├── Purchases.tsx         # Ingreso de stock
    └── Categories.tsx        # CRUD categorías
```

## Funcionalidades

- **Dashboard** — Resumen de productos, ventas, ingresos y stock bajo
- **Productos** — ABM completo con búsqueda, filtros por categoría y vista detalle
- **Ventas (POS)** — Carrito de compras, selección por código de barras, métodos de pago, recibo
- **Compras** — Ingreso de stock por factura, reposición y alta de nuevos productos
- **Categorías** — Administración de categorías

## Despliegue

### Build de producción

```bash
npm run build
```

El contenido estático se genera en `dist/` y puede servirse con cualquier servidor web.

### Ejemplo con Vite preview

```bash
npm run preview
```

### Servir con cualquier servidor estático

```bash
npx serve dist
```

## Nota

Actualmente los datos se almacenan en memoria (Zustand + mock data). No hay persistencia ni backend. Los datos se pierden al recargar la página.
