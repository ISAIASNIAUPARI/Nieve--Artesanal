import { defineField, defineType } from 'sanity'

export const aboutSection = defineType({
  name: 'aboutSection',
  title: '2 · Sobre Nosotros',
  type: 'document',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Etiqueta superior',
      description: 'Texto pequeño en mayúsculas, arriba del título. Ej: "Nuestra manera".',
      type: 'string',
    }),
    defineField({
      name: 'heading',
      title: 'Título',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required().error('Hace falta un título para esta sección.'),
    }),
    defineField({
      name: 'paragraph1',
      title: 'Primer párrafo',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'paragraph2',
      title: 'Segundo párrafo',
      description: 'Opcional. Se muestra debajo del primero.',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'image',
      title: 'Foto',
      description: 'Se muestra a la derecha del texto, recortada en formato horizontal.',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Texto alternativo', type: 'string' })],
      validation: (Rule) => Rule.required().error('Hace falta una foto para esta sección.'),
    }),
  ],
  preview: {
    select: { media: 'image' },
    prepare: ({ media }) => ({ title: '2 · Sobre Nosotros', media }),
  },
})
