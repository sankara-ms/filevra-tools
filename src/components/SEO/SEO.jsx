import { Head } from 'vite-react-ssg'
import { absoluteUrl, OG_IMAGE, SITE_NAME } from '../../config/site'

export default function SEO({
  title,
  description,
  path = '/',
  type = 'website',
  image = OG_IMAGE,
  noindex = false,
  jsonLd = [],
}) {
  const url = absoluteUrl(path)
  const schemas = (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter(Boolean)

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={`${SITE_NAME} - free image and PDF preparation tools`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
        />
      ))}
    </Head>
  )
}
