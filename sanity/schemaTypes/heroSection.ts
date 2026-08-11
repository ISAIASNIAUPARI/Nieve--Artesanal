import { defineField, defineType } from 'sanity'

export const heroSection = defineType({
  name: 'heroSection',
  title: '1 · Portada',
  type: 'document',
  fields: [
    defineField({
      name: 'badgeText',
      title: 'Etiqueta superior',
      description: 'Texto pequeño con borde, arriba del título. Ej: "Heladería artesanal". Si lo dejas vacío, no se muestra.',
      type: 'string',
    }),
    defineField({
      name: 'heading',
      title: 'Título',
      description: 'El titular grande de la portada.',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required().error('Hace falta un título: es lo primero que se ve.'),
    }),
    defineField({
      name: 'description',
      title: 'Párrafo',
      description: 'Texto debajo del título, explicando qué ofrece el negocio.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'primaryButtonText',
      title: 'Texto del botón principal',
      description: 'Botón relleno. Ej: "Ver sabores".',
      type: 'string',
    }),
    defineField({
      name: 'primaryButtonLink',
      title: 'Destino del botón principal',
      description: 'Para ir a una sección de esta misma página usa # y el nombre: #sabores',
      type: 'string',
    }),
    defineField({
      name: 'secondaryButtonText',
      title: 'Texto del botón secundario',
      description: 'Botón con borde, sin relleno. Ej: "Cómo llegar". Si lo dejas vacío junto con su destino, no se muestra.',
      type: 'string',
    }),
    defineField({
      name: 'secondaryButtonLink',
      title: 'Destino del botón secundario',
      description: 'Para ir a una sección de esta misma página usa # y el nombre: #ubicacion',
      type: 'string',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Foto de fondo',
      description: 'Ocupa toda la portada. Sube una foto horizontal y ajusta el punto focal para que se vea bien en móvil.',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Texto alternativo', type: 'string' })],
      validation: (Rule) => Rule.required().error('Hace falta una foto de fondo para la portada.'),
    }),
  ],
  preview: {
    select: { media: 'backgroundImage' },
    prepare: ({ media }) => ({ title: '1 · Portada', media }),
  },
})
