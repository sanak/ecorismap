export const hsv2rgb = (H: number, S: number, V: number): string => {
  //https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV

  const C = V * S;
  const Hp = H / 60;
  const X = C * (1 - Math.abs((Hp % 2) - 1));

  let R = 0;
  let G = 0;
  let B = 0;
  if (Hp >= 0 && Hp < 1) {
    [R, G, B] = [C, X, 0];
  }
  if (Hp >= 1 && Hp < 2) {
    [R, G, B] = [X, C, 0];
  }
  if (Hp >= 2 && Hp < 3) {
    [R, G, B] = [0, C, X];
  }
  if (Hp >= 3 && Hp < 4) {
    [R, G, B] = [0, X, C];
  }
  if (Hp >= 4 && Hp < 5) {
    [R, G, B] = [X, 0, C];
  }
  if (Hp >= 5 && Hp < 6) {
    [R, G, B] = [C, 0, X];
  }

  const m = V - C;
  [R, G, B] = [R + m, G + m, B + m];

  R = Math.floor(R * 255);
  G = Math.floor(G * 255);
  B = Math.floor(B * 255);

  return '#' + zeroPadding(R.toString(16), 2) + zeroPadding(G.toString(16), 2) + zeroPadding(B.toString(16), 2);
};

const zeroPadding = (num: string, length: number) => {
  return ('0000000000' + num).slice(-length);
};

export const hex2rgba = (hex: string, alpha = 1): string | undefined => {
  // ロングバージョンの場合（例：#FF0000）
  let r = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  let c: number[] = [];
  if (r) {
    c = r.slice(1, 4).map(function (x) {
      return parseInt(x, 16);
    });
  }
  // ショートバージョンの場合（例：#F00）
  r = hex.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
  if (r) {
    c = r.slice(1, 4).map(function (x) {
      return 0x11 * parseInt(x, 16);
    });
  }
  // 該当しない場合は、undefinedを返す.
  if (c.length === 0) {
    return undefined;
  }
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
};

export const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};
