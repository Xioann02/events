export const MAX_UPLOAD_SIZE = 50 * 1024 * 1024
export const ACCEPTED_MEDIA_TYPES =
  'image/jpeg,image/png,image/webp,video/mp4,video/webm'

const SUPPORTED_MEDIA_EXTENSION = /\.(jpe?g|png|webp|mp4|webm)$/i

export function isSupportedMedia(file) {
  return SUPPORTED_MEDIA_EXTENSION.test(file.name) && file.size <= MAX_UPLOAD_SIZE
}

export function createUploadSlide(file) {
  return {
    id: `${file.name}-${file.lastModified}-${Math.random()}`,
    src: URL.createObjectURL(file),
    type: file.type.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name) ? 'video' : 'image',
    alt: file.name,
    name: file.name,
    uploaded: true,
  }
}
