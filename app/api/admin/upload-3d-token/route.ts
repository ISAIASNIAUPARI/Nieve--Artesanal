import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { isAdminRequest } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

/**
 * Autoriza (y le da el token de un solo uso) a una subida directa
 * navegador → Vercel Blob del .glb SIN optimizar todavía.
 *
 * Por qué Vercel Blob y no Cloudinary para este paso: el .glb original puede
 * pesar decenas de MB. Subirlo directo a Cloudinary (resource_type "raw")
 * topa con un límite de ~10 MB propio de la cuenta — ni partiéndolo en
 * trozos se puede sortear, porque Cloudinary valida contra el tamaño TOTAL
 * declarado, no contra el peso de cada petición. Vercel Blob no tiene ese
 * tipo de tope por archivo, y es el storage nativo de la misma plataforma
 * donde corre el sitio.
 *
 * /api/admin/optimize-3d sigue siendo quien descarga este archivo temporal,
 * lo optimiza con gltf-transform, y sube la versión final a Cloudinary —
 * ahí no cambia nada del pipeline de siempre.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Sesión inválida. Vuelve a iniciar sesión.' }, { status: 401 })
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // El nombre real del archivo no importa para el resultado final —
        // /optimize-3d siempre sube con un public_id nuevo a Cloudinary. El
        // cliente ya manda el pathname con el prefijo "raw-tmp/" (ver
        // Glb3DUploader.tsx); acá solo se valida la extensión.
        if (!pathname.toLowerCase().startsWith('raw-tmp/') || !pathname.toLowerCase().endsWith('.glb')) {
          throw new Error('Solo se aceptan archivos .glb.')
        }
        return {
          allowedContentTypes: ['model/gltf-binary', 'application/octet-stream'],
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_BYTES,
        }
      },
      // No hace falta ninguna acción acá — el frontend dispara /optimize-3d
      // apenas termina la subida, sin depender de este callback (que además
      // solo se puede probar en producción/preview, nunca en local).
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(jsonResponse)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'No se pudo iniciar la subida.' },
      { status: 400 }
    )
  }
}
