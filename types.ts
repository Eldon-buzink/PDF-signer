export interface Signature {
  id: string;
  data: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  page: number;
}

export interface TextElement {
  id: string;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  page: number;
  font?: string;
  color?: string;
} 