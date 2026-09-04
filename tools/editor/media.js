// Decodifica formatos raster e envia apenas um PNG normalizado ao servidor.
export async function importImage(file, api) {
  if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Escolha uma imagem PNG, JPEG ou WebP.');
  if (file.size > 8 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 8 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width > 4096 || bitmap.height > 4096 || bitmap.width * bitmap.height > 8_000_000)
      throw new Error('A imagem deve ter até 4096 px por lado e 8 milhões de pixels.');
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap,0,0);
    const png = canvas.toDataURL('image/png').split(',')[1];
    return await api('upload', {name:file.name, png});
  } finally { bitmap.close(); }
}
