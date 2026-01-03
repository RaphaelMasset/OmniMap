export class Utils {
  private static getCanvasContext(refEl: HTMLElement): CanvasRenderingContext2D {
    const style = getComputedStyle(refEl);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = font;
    return ctx;
  }

  static measureTextWidthPx(text: string, refEl: HTMLElement): number {
    return this.getCanvasContext(refEl).measureText(text).width;
  }

  static measureTextHeightPx(text: string, refEl: HTMLElement): number {
    const metrics = this.getCanvasContext(refEl).measureText(text);
    
    // Real height = ascent (top) + descent (bottom) [web:46][web:112][web:115]
    if (metrics.actualBoundingBoxAscent !== undefined && metrics.actualBoundingBoxDescent !== undefined) {
      return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    }
    
    // Fallback: parse font-size (works everywhere)
    const fontSizeMatch = getComputedStyle(refEl).fontSize.match(/(\d+)px/);
    return fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 16;
  }
}
