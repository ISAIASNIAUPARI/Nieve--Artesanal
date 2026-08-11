export interface SanityImageValue {
  asset?: { _ref: string; _type: 'reference' }
  alt?: string
}

export interface SiteSettingsData {
  brandName?: string
  footerNote?: string
}

export interface HeroSectionData {
  badgeText?: string
  heading?: string
  description?: string
  primaryButtonText?: string
  primaryButtonLink?: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  backgroundImage?: SanityImageValue
}

export interface AboutSectionData {
  eyebrow?: string
  heading?: string
  paragraph1?: string
  paragraph2?: string
  image?: SanityImageValue
}

export interface FlavorsSectionData {
  eyebrow?: string
  heading?: string
  featuredImage?: SanityImageValue
  featuredImageCaption?: string
  secondaryImage1?: SanityImageValue
  secondaryImage1Caption?: string
  secondaryImage2?: SanityImageValue
  secondaryImage2Caption?: string
  bannerImage?: SanityImageValue
  bannerImageCaption?: string
}

export interface VideoSectionData {
  eyebrow?: string
  heading?: string
  video?: { asset?: { _ref: string; _type: 'reference'; url?: string } }
}

export interface LocationSectionData {
  eyebrow?: string
  heading?: string
  address?: string
  schedule?: string
  phone?: string
  confirmationMessage?: string
}

export interface HomePageData {
  siteSettings?: SiteSettingsData
  hero?: HeroSectionData
  about?: AboutSectionData
  flavors?: FlavorsSectionData
  video?: VideoSectionData
  location?: LocationSectionData
}
