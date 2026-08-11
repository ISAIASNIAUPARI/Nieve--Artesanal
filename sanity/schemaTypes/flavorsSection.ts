import { defineField, defineType } from 'sanity'

const imageWithCaption = (name: string, title: string, description: string, required = false) => [
  defineField({
    name,
    title,
    description,
    type: 'image',
    options: { hotspot: true },
    fields: [defineField({ name: 'alt', title: 'Texto alternativo', type: 'string' })],
    validation: required ? (Rule: any) => Rule.required().error('Falta la foto de este bloque de la vitrina.') : undefined,
  }),
  defineField({
    name: `${name}Caption`,
    title: `Texto sobre "${title}"`,
    description: 'Frase corta que aparece encima de la foto, abajo a la izquierda.',
    type: 'string',
  }),
]

export const flavorsSection = defineType({
  name: 'flavorsSection',
  title: '3 · Sabores',
  type: 'document',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Etiqueta superior',
      type: 'string',
    }),
    defineField({
      name: 'heading',
      title: 'Título',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required().error('Hace falta un título para esta sección.'),
    }),
    ...imageWithCaption(
      'featuredImage',
      'Foto grande (izquierda)',
      'Ocupa el doble de alto que las demás. Sube una foto vertical u horizontal alta para que se vea completa.',
      true
    ),
    ...imageWithCaption('secondaryImage1', 'Foto mediana 1', 'Arriba a la derecha de la foto grande.'),
    ...imageWithCaption('secondaryImage2', 'Foto mediana 2', 'Debajo de la foto mediana 1.'),
    ...imageWithCaption('bannerImage', 'Foto ancha (abajo)', 'Franja panorámica debajo de la cuadrícula. Sube una foto muy horizontal.'),
  ],
  preview: {
    select: { media: 'featuredImage' },
    prepare: ({ media }) => ({ title: '3 · Sabores', media }),
  },
})
