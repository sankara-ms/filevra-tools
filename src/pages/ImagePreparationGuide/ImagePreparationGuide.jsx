import { Link } from 'react-router-dom'
import SEO from '../../components/SEO/SEO'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import Icon from '../../components/Icon/Icon'
import AdSlot from '../../components/AdSlot/AdSlot'
import { articleJsonLd } from '../../utils/schema'

const TOC = [
  { id: 'start', label: 'Start with the destination' },
  { id: 'pixels', label: 'Pixels, DPI and print size' },
  { id: 'size', label: 'Why file sizes differ' },
  { id: 'formats', label: 'JPG, PNG or WebP' },
  { id: 'compression', label: 'What quality changes' },
  { id: 'photo', label: 'Preparing a photo' },
  { id: 'signature', label: 'Preparing a signature' },
  { id: 'check', label: 'Checking the result' },
  { id: 'privacy', label: 'Keeping files private' },
]

export default function ImagePreparationGuide() {
  return (
    <>
      <SEO
        title="Image Preparation Guide - Pixels, File Size and Compression | FormReady"
        description="A practical guide to preparing photos and signatures for online forms: pixel dimensions, DPI, file size, formats and compression quality explained without jargon."
        path="/image-preparation-guide"
        type="article"
        jsonLd={articleJsonLd({
          headline: 'Image Preparation Guide: Pixels, File Size and Compression',
          description:
            'How pixel dimensions, file size, formats and compression interact when preparing a photo or signature for an online form.',
          path: '/image-preparation-guide',
        })}
      />

      <div className="fr-page-head">
        <div className="fr-container">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Guides', to: '/#tools' }, { label: 'Image preparation' }]} />
          <h1>Image preparation guide</h1>
          <p>
            A form asks for “200 × 230 pixels, under 50 KB”. Another asks for a signature that is “clear and recent”.
            This guide explains what those instructions mean, why file size and pixel size are different things, and how
            to prepare a clean image without guessing.
          </p>
        </div>
      </div>

      <section className="fr-section">
        <div className="fr-container fr-tool-layout">
          <article className="fr-prose">
            <h2 id="start">Start with the destination, not the editor</h2>
            <p>
              The most useful number is the one on the page where the file will be uploaded. It may be a pixel size, a
              maximum file size, an accepted format, or all three. Write those requirements down before touching the
              image. Preparing first and discovering the limit afterwards usually means starting again.
            </p>
            <p>
              If the instructions only say “passport photo” or “signature”, they are incomplete. Look for a help page,
              a sample image or a size in pixels or millimetres. A size copied from an unrelated website may be wrong
              for your destination.
            </p>

            <h2 id="pixels">Pixels, DPI and print size</h2>
            <p>
              A digital image is a grid of pixels. A 200 × 230 image is 200 pixels wide and 230 pixels tall, which is
              46,000 pixels in total. Online forms almost always check this grid, because it is unambiguous and easy to
              verify.
            </p>
            <p>
              DPI stands for dots per inch and describes how densely those pixels should be printed. The same 600 × 600
              pixel image is 2 inches wide at 300 DPI and 6 inches wide at 100 DPI. The pixels do not change when the
              DPI value changes, so setting 300 DPI on a small image does not make it sharper or larger on screen.
            </p>
            <p>
              Physical size, pixels and DPI are linked by one relationship: pixels = inches × DPI. If a form asks for a
              35 mm wide photo at 300 DPI, that is roughly 1.38 inches, so about 413 pixels. Converting the requirement
              into pixels is usually the safest route.
            </p>

            <h2 id="size">Why two images with the same pixels have different sizes</h2>
            <p>
              File size depends on how much detail the encoder has to store. A photo of a leafy tree contains thousands
              of tiny colour variations; a signature on white paper contains mostly flat white space and a few dark
              strokes. At identical dimensions, the tree will be several times larger.
            </p>
            <p>
              Camera settings also matter. A phone photo may carry metadata, a colour profile and a high-quality
              encoding. Cropping away unnecessary background, reducing noise and re-encoding at a sensible quality all
              reduce the number of bytes without changing the pixel dimensions.
            </p>
            <p>
              This is why “make it 50 KB” and “make it 200 pixels wide” are different tasks. The{' '}
              <Link to="/photo-signature-resizer">photo and signature resizer</Link> handles the dimensions and can also
              aim for a size cap; the <Link to="/image-compressor">image compressor</Link> treats the target size as the
              main goal.
            </p>

            <h2 id="formats">JPG, PNG or WebP</h2>
            <p>
              JPEG is designed for photographs. It stores smooth colour changes efficiently and produces small files,
              but it cannot store transparency and it blurs fine detail at low quality. Most forms that ask for a photo
              expect JPEG.
            </p>
            <p>
              PNG is lossless and supports transparency, which makes it suitable for logos, screenshots and line art. A
              photograph saved as PNG is often much larger than the same photo as JPEG. WebP can be smaller than both,
              but not every portal accepts it, and older software may refuse to open it.
            </p>
            <p>
              When a form lists accepted formats, treat that list as a hard requirement. A perfectly prepared WebP that
              the portal rejects is not prepared at all.
            </p>

            <h2 id="compression">What compression quality really changes</h2>
            <p>
              JPEG quality is a trade-off, not a percentage of the original file size. At high quality the encoder keeps
              more detail; at low quality it discards subtle variation that the eye may not notice in a landscape but
              will notice around sharp edges and text. Signatures and scanned documents are unforgiving: cheap
              compression creates grey halos and blocky strokes.
            </p>
            <p>
              Resolution is the stronger lever. Halving the width and height quarters the number of pixels, which
              usually shrinks the file far more than a small quality change. That is why a sharp 2000-pixel photo
              reduced to the required 400 pixels often fits the limit comfortably at high quality, while a 400-pixel
              photo squeezed to 20 KB looks rough no matter what quality setting is used.
            </p>
            <p>
              FormReady's compressor searches for the highest quality that fits your target and only reduces dimensions
              if it must. The result panel shows which compromise was made.
            </p>

            <h2 id="photo">Preparing a photo</h2>
            <ol>
              <li>Use a recent photo with the full face visible, if the form is an identity photo.</li>
              <li>Choose even, indirect light. Avoid a strong lamp on one side or a window directly behind you.</li>
              <li>Use a plain background if the instructions require one; a white wall is usually safer than a busy room.</li>
              <li>Crop to the required framing before resizing, so the face is not pushed off-centre.</li>
              <li>Resize down to the required pixels. Avoid enlarging a small photo; it cannot gain detail.</li>
              <li>Check the file size and format, then upload the copy you prepared.</li>
            </ol>

            <h2 id="signature">Preparing a signature</h2>
            <p>
              A useful signature image is sharp, high-contrast and free of background clutter. Sign in dark ink on
              plain, unlined white paper. Photograph the paper straight on, with the camera parallel to the page, and
              let daylight or a soft room light illuminate it evenly. Avoid a flash close to the paper, which creates a
              bright patch and a hard shadow.
            </p>
            <p>
              Crop tightly around the signature, leaving a small even margin, then reduce it to the required
              dimensions. A phone photo of a signature is often 3000 pixels wide; reducing it to 300 pixels usually
              produces a clean, small file. Enlarging a tiny crop produces a blurry one.
            </p>
            <p>
              If the form requires a white background, make sure the crop does not include a desk, a hand or a coloured
              surface. Transparency from a PNG will be flattened to white when the image is converted to JPEG, which is
              normally what a portal expects.
            </p>

            <h2 id="check">Checking the result</h2>
            <p>
              Before uploading, open the finished file and check three things: the pixel dimensions, the file size and
              the visual quality at 100% zoom. On a phone, the same checks are available in the photo viewer or a file
              manager. Then look at the portal's own preview if it offers one; a surprising number of rejections are
              caused by the wrong file being selected rather than the wrong settings.
            </p>
            <p>
              Keep the original untouched. If the portal rejects the prepared copy, you can try again without
              re-photographing the document.
            </p>

            <h2 id="privacy">Keeping files private</h2>
            <p>
              Identity photos and signatures are sensitive. Prefer tools that process the file on your device, and avoid
              uploading such documents to sites you do not trust. FormReady's tools run in the browser tab, so the image
              is not sent to a server. The trade-off is that the quality of the result depends on your device's
              browser, but the privacy benefit is real.
            </p>

            <div className="fr-note">
              Ready to prepare a file? Use the <Link to="/photo-signature-resizer">photo and signature resizer</Link> for
              exact pixels, or the <Link to="/image-compressor">image compressor</Link> when a maximum file size is the
              main requirement.
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
                  <Link to="/photo-signature-resizer">
                    <Icon name="Scaling" size={16} />
                    Photo and Signature Resizer
                  </Link>
                </li>
                <li>
                  <Link to="/image-compressor">
                    <Icon name="ImageDown" size={16} />
                    Image Compressor
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
                Resize first, compress second. Meeting the pixel requirement at high quality usually makes the file
                limit easy to reach.
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
