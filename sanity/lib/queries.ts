import { groq } from 'next-sanity'

export const siteSettingsQuery = groq`*[_id == "siteSettings"][0]`
export const heroSectionQuery = groq`*[_id == "heroSection"][0]`
export const aboutSectionQuery = groq`*[_id == "aboutSection"][0]`
export const flavorsSectionQuery = groq`*[_id == "flavorsSection"][0]`
export const videoSectionQuery = groq`*[_id == "videoSection"][0]{ ..., video{ asset->{ _ref, _type, url } } }`
export const locationSectionQuery = groq`*[_id == "locationSection"][0]`

export const homePageQuery = groq`{
  "siteSettings": ${siteSettingsQuery},
  "hero": ${heroSectionQuery},
  "about": ${aboutSectionQuery},
  "flavors": ${flavorsSectionQuery},
  "video": ${videoSectionQuery},
  "location": ${locationSectionQuery}
}`
