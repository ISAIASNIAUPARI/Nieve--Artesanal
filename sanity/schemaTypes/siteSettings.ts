import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Ajustes generales',
  type: 'document',
  fields: [
    defineField({
      name: 'brandName',
      title: 'Nombre del negocio',
      description: 'Se muestra en la cabecera y en el pie de página, con la tipografía de marca.',
      type: 'string',
      validation: (Rule) => Rule.required().error('Hace falta un nombre: se muestra en la cabecera.'),
    }),
    defineField({
      name: 'footerNote',
      title: 'Nota del pie de página',
      description: 'Texto pequeño junto al copyright. Por ejemplo: "Sitio de demostración".',
      type: 'string',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Ajustes generales' }),
  },
})
