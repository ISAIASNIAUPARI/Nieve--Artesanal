import type { StructureResolver } from 'sanity/structure'

export const singletons = [
  { id: 'siteSettings', type: 'siteSettings', title: 'Ajustes generales', icon: '⚙️' },
  { id: 'heroSection', type: 'heroSection', title: '1 · Portada', icon: '🖼️' },
  { id: 'aboutSection', type: 'aboutSection', title: '2 · Sobre Nosotros', icon: '📖' },
  { id: 'flavorsSection', type: 'flavorsSection', title: '3 · Sabores', icon: '🍦' },
  { id: 'videoSection', type: 'videoSection', title: '4 · Cómo lo hacemos', icon: '🎥' },
  { id: 'locationSection', type: 'locationSection', title: '5 · Ubicación y Contacto', icon: '📍' },
]

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Nieve Artesanal')
    .items(
      singletons.map((s) =>
        S.listItem()
          .title(`${s.icon}  ${s.title}`)
          .id(s.id)
          .child(S.document().schemaType(s.type).documentId(s.id).title(s.title))
      )
    )
