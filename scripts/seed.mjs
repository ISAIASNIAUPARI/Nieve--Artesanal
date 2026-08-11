import { createClient } from '@sanity/client'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset || !token) {
  console.error('Faltan NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET o SANITY_API_WRITE_TOKEN en .env.local')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

const assetsDir = path.join(__dirname, '..', 'imagenes')

async function uploadImage(filename, description) {
  const filePath = path.join(assetsDir, filename)
  const asset = await client.assets.upload('image', fs.createReadStream(filePath), { filename })
  console.log(`  imagen subida: ${filename} → ${asset._id}`)
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt: description }
}

async function uploadVideo(filename) {
  const filePath = path.join(assetsDir, filename)
  const asset = await client.assets.upload('file', fs.createReadStream(filePath), { filename })
  console.log(`  vídeo subido: ${filename} → ${asset._id}`)
  return { _type: 'file', asset: { _type: 'reference', _ref: asset._id } }
}

async function main() {
  console.log(`Sembrando contenido en ${projectId}/${dataset}...`)

  const [heroImage, aboutImage, featuredImage, secondaryImage1, secondaryImage2, bannerImage, video] = await Promise.all([
    uploadImage('hero-vitrina-mix.png', 'Selección de helados, tortas y galletas artesanales'),
    uploadImage('conos-heladeria.png', 'Dos conos de helado frente a la fachada de la heladería'),
    uploadImage('vitrina-sabores.png', 'Vitrina con más de diez sabores de gelato artesanal'),
    uploadImage('copa-chocolate-avellana.png', 'Copa de chocolate con crocante de avellana'),
    uploadImage('copa-soft-pistacho.png', 'Copa de soft serve con crumble de pistacho'),
    uploadImage('crepe-fresa.png', 'Crepe relleno con helado de fresa y salsa de frutos rojos'),
    uploadVideo('video-heladeria.mp4'),
  ])

  const documents = [
    {
      _id: 'siteSettings',
      _type: 'siteSettings',
      brandName: 'Nieve Artesanal',
      footerNote: 'Sitio de demostración.',
    },
    {
      _id: 'heroSection',
      _type: 'heroSection',
      badgeText: 'Heladería artesanal',
      heading: 'Helado hecho como debe ser',
      description:
        'Gelato, sorbetes y postres helados elaborados a diario con fruta de temporada, cacao real y crema fresca. Sin mezclas industriales.',
      primaryButtonText: 'Ver sabores',
      primaryButtonLink: '#sabores',
      secondaryButtonText: 'Cómo llegar',
      secondaryButtonLink: '#ubicacion',
      backgroundImage: heroImage,
    },
    {
      _id: 'aboutSection',
      _type: 'aboutSection',
      eyebrow: 'Nuestra manera',
      heading: 'Pocos ingredientes, bien elegidos',
      paragraph1:
        'Cada lote se prepara a mano en batches pequeños. Trabajamos con productores locales de fruta y lácteos, y evitamos saborizantes artificiales.',
      paragraph2: 'El resultado: una textura más cremosa y un sabor que se siente real, cono a cono.',
      image: aboutImage,
    },
    {
      _id: 'flavorsSection',
      _type: 'flavorsSection',
      eyebrow: 'La vitrina',
      heading: 'Sabores del día',
      featuredImage,
      featuredImageCaption: 'Más de 12 sabores rotativos',
      secondaryImage1,
      secondaryImage1Caption: 'Chocolate con crocante',
      secondaryImage2,
      secondaryImage2Caption: 'Soft de pistacho',
      bannerImage,
      bannerImageCaption: 'Crepe con helado de fresa — nuestro postre firma',
    },
    {
      _id: 'videoSection',
      _type: 'videoSection',
      eyebrow: 'Detrás de barra',
      heading: 'Cómo lo hacemos',
      video,
    },
    {
      _id: 'locationSection',
      _type: 'locationSection',
      eyebrow: 'Visítanos',
      heading: 'Ubicación y horario',
      address: 'Av. Principal 245, esquina con Calle Real',
      schedule: 'Lunes a domingo · 12:00 – 22:00',
      phone: '+00 000 000 000',
      confirmationMessage: 'Gracias, te responderemos pronto.',
    },
  ]

  for (const doc of documents) {
    await client.createOrReplace(doc)
    console.log(`  documento publicado: ${doc._id}`)
  }

  console.log('Listo.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
