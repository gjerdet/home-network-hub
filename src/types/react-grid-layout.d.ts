declare module "react-grid-layout" {
  import * as React from "react";

  export interface LayoutItem {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
  }

  export type Layouts = Record<string, LayoutItem[]>;

  export interface ReactGridLayoutProps {
    className?: string;
    layout?: LayoutItem[];
    layouts?: Layouts;
    cols?: number | Record<string, number>;
    breakpoints?: Record<string, number>;
    rowHeight?: number;
    isDraggable?: boolean;
    isResizable?: boolean;
    compactType?: "vertical" | "horizontal" | null;
    margin?: [number, number];
    draggableHandle?: string;
    onLayoutChange?: (layout: LayoutItem[], allLayouts: Layouts) => void;
    children?: React.ReactNode;
    width?: number;
  }

  class Responsive extends React.Component<ReactGridLayoutProps> {}
  function WidthProvider<P extends object>(
    component: React.ComponentType<P>
  ): React.ComponentType<Omit<P, "width">>;

  class ReactGridLayout extends React.Component<ReactGridLayoutProps> {
    static Responsive: typeof Responsive;
    static WidthProvider: typeof WidthProvider;
  }

  export default ReactGridLayout;
}

declare module "react-grid-layout/css/styles.css" {}
declare module "react-resizable/css/styles.css" {}
