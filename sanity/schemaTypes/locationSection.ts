import { defineField, defineType } from 'sanity'

export const locationSection = defineType({
  name: 'locationSection',
  title: '5 · Ubicación y Contacto',
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
      name: 'address',
      title: 'Dirección',
      description: 'Se muestra tal cual la escribas, con saltos de línea si usas varias líneas.',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'schedule',
      title: 'Horario',
      description: 'Ej: "Lunes a domingo · 12:00 – 22:00".',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'phone',
      title: 'Teléfono',
      type: 'string',
    }),
    defineField({
      name: 'confirmationMessage',
      title: 'Mensaje tras enviar el formulario',
      description: 'Lo ve el cliente después de pulsar "Enviar mensaje".',
      type: 'string',
    }),
  ],
  preview: {
    prepare: () => ({ title: '5 · Ubicación y Contacto' }),
  },
})
