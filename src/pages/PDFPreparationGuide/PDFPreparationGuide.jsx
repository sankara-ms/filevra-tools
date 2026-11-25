import { Link } from 'react-router-dom'
import SEO from '../../components/SEO/SEO'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import Icon from '../../components/Icon/Icon'
import AdSlot from '../../components/AdSlot/AdSlot'
import { articleJsonLd } from '../../utils/schema'

const TOC = [
  { id: 'inside', label: 'What is inside a PDF' },
  { id: 'size', label: 'Why PDF sizes vary' },
  { id: 'merge', label: 'Merging without quality loss' },
  { id: 'compress', label: 'Structural vs image compression' },
  { id: 'scan', label: 'Scanning for a smaller file' },
  { id: 'sensitive', label: 'Handling sensitive documents' },
  { id: 'check', label: 'Checking the result' },
]

export default function PDFPreparationGuide() {
  return (
    <>
      <SEO
        title="PDF Preparation Guide - Merging, Compression and File Size | Filevra"
        description="Understand why PDFs become large, how merging preserves page quality, when raster compression helps and when it destroys searchable text. Practical guidance, no jargon."
        path="/pdf-preparation-guide"
        type="article"
        jsonLd={articleJsonLd({
          headline: 'PDF Preparation Guide: Merging, Compression and File Size',
          description:
            'Why PDF file sizes vary, how merging works, and when page rasterization helps or harms a document.',
          path: '/pdf-preparation-guide',
        })}
      />

      <div className="fr-page-head">
        <div className="fr-container">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'PDF preparation guide' }]} />
          <h1>PDF preparation guide</h1>
          <p>
            PDFs can be 80 KB or 80 MB with the same number of pages. Merging, compressing and scanning all change a
            document in different ways. This guide explains what actually makes a PDF large, and how to choose a
            preparation method that keeps the document usable.
          </p>
        </div>
      </div>

      <section className="fr-section">
        <div className="fr-container fr-tool-layout">
          <article className="fr-prose">
            <h2 id="inside">What is inside a PDF</h2>
            <p>
              A PDF is a container, not a picture format. It holds page descriptions, fonts, images, vector drawings
              and optional structures such as bookmarks, links and forms. A page of typed text may contain only a few
              kilobytes of instructions plus a subset of a font. A scanned page may contain a single photograph that is
              several megabytes.
            </p>
            <p>
              This distinction explains almost every surprise about PDF size. Two documents with identical page counts
              can differ by a factor of a hundred depending on whether their pages are text or images.
            </p>

            <h2 id="size">Why PDF sizes vary so much</h2>
            <p>
              The largest factor is embedded images. A colour scan at 600 DPI of an A4 page is roughly 4960 × 7016
              pixels — about 105 megapixels per page. Even efficient compression leaves a substantial file. The same
              page scanned at 200 DPI in grayscale is about 1654 × 2339 pixels, less than a tenth of the pixel count, and
              usually plenty for reading.
            </p>
            <p>
              Fonts, annotations and duplicate resources add smaller amounts. An exported report with hundreds of vector
              charts can also be large without containing a single photograph. There is no single “compress PDF” button
              that handles both cases well, which is why understanding the content matters.
            </p>

            <h2 id="merge">Merging without quality loss</h2>
            <p>
              Merging copies existing pages into a new document. The images and text inside those pages are not
              re-encoded, so the visible quality stays the same. The merged file is approximately the sum of its parts,
              plus a small overhead.
            </p>
            <p>
              Page content survives, but document-level features may not. Bookmarks, named destinations, some link
              annotations and interactive form fields live outside individual pages and may be dropped when pages are
              assembled into a new file. If those features matter, open the merged result and test them before sending
              it on.
            </p>
            <p>
              Password-protected PDFs cannot be merged without the password. Remove the protection in a PDF reader
              first; a tool that asks you to upload the password to a server is asking for more trust than it needs.
            </p>

            <h2 id="compress">Structural versus image compression</h2>
            <p>
              There are two broad approaches to making a PDF smaller, and they are not interchangeable.
            </p>
            <h3>Structural optimisation</h3>
            <p>
              This rewrites how the PDF is stored: removing unused objects, merging duplicate resources, compressing
              object streams and stripping metadata. It keeps text as text, links as links and images at their original
              resolution. Savings are usually modest — often a few percent to perhaps a fifth of the file — because the
              big embedded images are untouched.
            </p>
            <h3>Page rasterization</h3>
            <p>
              This renders every page to an image and builds a new PDF from those images. A scan can shrink
              dramatically, because a 600 DPI colour scan can be re-rendered at 120 DPI as a compressed JPEG. A text
              document loses its text layer entirely: it is no longer searchable, selectable or accessible to a screen
              reader, and the file may even grow because the original text was already efficient.
            </p>
            <p>
              Filevra's <Link to="/compress-pdf">PDF compressor</Link> uses the second method, openly and with a
              warning. It compares the result with the original and refuses to present a larger file as a success. If
              you need to keep searchable text, keep the original or use a structural optimiser instead.
            </p>

            <h2 id="scan">Scanning for a smaller file</h2>
            <p>
              Most oversized PDFs were oversized at the scanner. A few settings make a large difference:
            </p>
            <ul>
              <li>Scan text documents at 200–300 DPI. Higher resolution rarely improves readability on screen.</li>
              <li>Use grayscale for black text. Colour multiplies the data for no benefit.</li>
              <li>Use colour only when colour carries meaning: stamps, signatures in blue ink, highlighted sections.</li>
              <li>Scan both sides in a single pass if the scanner supports it, rather than merging later.</li>
              <li>Crop and straighten pages in the scanner software before saving.</li>
            </ul>
            <p>
              A 200 DPI grayscale scan of a text page is often under 200 KB. A 600 DPI colour scan of the same page can
              exceed 5 MB. The difference is in the scan, not in the PDF.
            </p>

            <h2 id="sensitive">Handling sensitive documents</h2>
            <p>
              Bank statements, identity documents and signed contracts deserve care. Prefer tools that process the file
              locally, and check whether the destination really needs the full document or only one page. Redact
              information properly — drawing a black box over text in a PDF editor can leave the underlying text
              selectable, so verify by trying to copy it.
            </p>
            <p>
              If you use a browser-based tool, remember that the document is handed to a web page. Filevra runs its
              processing in the tab and does not upload files, but the general advice still applies: use a browser you
              trust, on a device you control.
            </p>

            <h2 id="check">Checking the result</h2>
            <p>
              After merging or compressing, open the new file and check the page count, the order and the legibility of
              the smallest text at 100% zoom. If the document is a scan, look at a page with handwriting as well as a
              page of print; compression artefacts show up first around fine strokes.
            </p>
            <p>
              Then check the size against the destination's limit. A file that is readable but over the limit will still
              be rejected. If the limit is strict and the text must stay searchable, the honest answer may be that
              raster compression is the wrong tool — a structural optimiser or a fresh scan at a lower resolution is
              the better route.
            </p>

            <div className="fr-note">
              Need to act on this? Use the <Link to="/merge-pdf">PDF merger</Link> to combine files without
              re-compression, or the <Link to="/compress-pdf">PDF compressor</Link> for scanned documents that need a
              smaller file.
            </div>
          </article>

          <aside className="fr-aside">
            <div className="fr-aside-card">
              <h3>On this page</h3>
              <ul>
                {TOC.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="fr-aside-card">
              <h3>Tools mentioned</h3>
              <ul>
                <li>
                  <Link to="/merge-pdf">
                    <Icon name="Layers" size={16} />
                    PDF Merger
                  </Link>
                </li>
                <li>
                  <Link to="/compress-pdf">
                    <Icon name="Archive" size={16} />
                    PDF Compressor
                  </Link>
                </li>
                <li>
                  <Link to="/image-to-pdf">
                    <Icon name="FileImage" size={16} />
                    Image to PDF
                  </Link>
                </li>
              </ul>
            </div>
            <div className="fr-aside-card">
              <h3 className="d-flex align-items-center gap-2">
                <Icon name="Info" size={16} />
                Quick rule
              </h3>
              <p className="fr-aside-note">
                If you may need to search or copy the text later, do not rasterize the PDF. Keep the original and
                compress only the scanned copies.
              </p>
            </div>
          </aside>
        </div>
        <div className="fr-container">
          <AdSlot placement="content" />
        </div>
      </section>
    </>
  )
}
