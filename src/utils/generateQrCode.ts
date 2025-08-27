import QRCode from 'qrcode';

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, { width: 200, margin: 1 });
}
