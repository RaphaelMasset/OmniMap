export class Line {
  constructor(
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number
  ) {}

  // Retourne la pente (m) de la ligne
  getSlope(): number {
    return this.x1 === this.x2
      ? Infinity
      : (this.y2 - this.y1) / (this.x2 - this.x1);
  }

  // Retourne la pente perpendiculaire (rotation de 90°)
  rotateSlope90(m?: number): number {
    const slope = m ?? this.getSlope();
    if (slope === 0) return Infinity;   // horizontale → verticale
    if (!isFinite(slope)) return 0;     // verticale → horizontale
    return -1 / slope;
  }

  // Retourne la longueur de la ligne
  getLength(): number {
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Retourne un point à un ratio (0→1) de la ligne
  getPointAtRatio(ratio: number): { x: number; y: number } {
    // Clamp ratio pour éviter les dépassements
    const t = Math.min(Math.max(ratio, 0), 1);
    const x = this.x1 + (this.x2 - this.x1) * t;
    const y = this.y1 + (this.y2 - this.y1) * t;
    return { x, y };
  }
  getPointAtDistance(distance: number): { x: number; y: number } {
    // Calcul de la longueur totale de la ligne
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const totalLength = Math.sqrt(dx * dx + dy * dy);

    // Éviter la division par 0 et distances négatives
    if (totalLength === 0 || distance <= 0) {
      return { x: this.x1, y: this.y1 };
    } else if (distance >= totalLength) {
      return { x: this.x2, y: this.y2 };
    }

    // Calcul du ratio correspondant (distance / longueur totale)
    const t = distance / totalLength;

    // Calcul du point interpolé
    const x = this.x1 + dx * t;
    const y = this.y1 + dy * t;

    return { x, y };
  }
}
