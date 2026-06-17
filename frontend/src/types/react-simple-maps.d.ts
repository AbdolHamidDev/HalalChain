declare module "react-simple-maps" {
  import { ComponentType, ReactNode, SVGProps } from "react";

  interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
    };
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    children?: ReactNode;
  }

  interface GeographiesProps {
    geography: string | Record<string, unknown>;
    children: (context: {
      geographies: GeographyType[];
    }) => ReactNode;
  }

  interface GeographyType {
    rsmKey: string;
    type: string;
    properties: Record<string, string | number | undefined> & {
      name?: string;
      ISO_A2?: string;
    };
    geometry: Record<string, unknown>;
  }

  interface GeographyProps {
    geography: GeographyType;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: SVGProps<SVGPathElement>["style"] & { outline?: string; fill?: string };
      hover?: SVGProps<SVGPathElement>["style"] & { outline?: string; fill?: string; cursor?: string };
      pressed?: SVGProps<SVGPathElement>["style"] & { outline?: string };
    };
    onClick?: () => void;
  }

  interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseMove?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const Marker: ComponentType<MarkerProps>;
}