import sharp from 'sharp';

// Immagini generate al volo: niente file binari nei fixture.

export const pngWithAlpha = (width = 800, height = 400) =>
  sharp({ create: { width, height, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0.5 } } })
    .png()
    .toBuffer();

export const jpeg = (width = 2000, height = 1000) =>
  sharp({ create: { width, height, channels: 3, background: '#3366ff' } }).jpeg().toBuffer();

export const webp = (width = 300, height = 300) =>
  sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .webp()
    .toBuffer();

export const gif = () =>
  sharp({ create: { width: 10, height: 10, channels: 3, background: '#000' } }).gif().toBuffer();

export const svg = () =>
  Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>');

// PNG valido nell'intestazione ma troncato: supera metadata() e fallisce in decodifica.
export const truncatedPng = async () => (await pngWithAlpha()).subarray(0, 200);
