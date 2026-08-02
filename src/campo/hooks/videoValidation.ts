const TIMEOUT_MS = 5000

export function validateVideoDuration(file: File, maxSeconds: number): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')

    const cleanup = () => URL.revokeObjectURL(url)

    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Não foi possível verificar a duração do vídeo'))
    }, TIMEOUT_MS)

    video.addEventListener('loadedmetadata', () => {
      clearTimeout(timer)
      cleanup()
      resolve(
        video.duration > maxSeconds ? `Vídeo muito longo — máximo ${maxSeconds} segundos` : null
      )
    })

    video.src = url
  })
}
