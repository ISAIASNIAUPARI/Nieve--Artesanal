import { defineField, defineType } from 'sanity'

export const videoSection = defineType({
  name: 'videoSection',
  title: '4 · Cómo lo hacemos',
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
    defineField({
      name: 'video',
      title: 'Vídeo',
      description: 'Se reproduce solo, sin sonido y en bucle, cuando el visitante hace scroll hasta aquí. Formato MP4.',
      type: 'file',
      options: { accept: 'video/mp4' },
    }),
  ],
  preview: {
    prepare: () => ({ title: '4 · Cómo lo hacemos' }),
  },
})
