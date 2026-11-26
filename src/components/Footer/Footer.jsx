import { Link } from 'react-router-dom'
import { BrandMark } from '../Icon/Icon'
import { CONTACT_EMAIL, SITE_NAME } from '../../config/site'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="fr-footer">
      <div className="fr-container">
        <div className="fr-footer-grid">
          <div className="fr-footer-brand">
            <Link to="/" className="fr-brand">
              <span className="fr-brand-mark">
                <BrandMark size={30} />
              </span>
              <span>{SITE_NAME}</span>
            </Link>
            <p>
              Free browser-based tools to prepare images and PDF documents. Files are processed on your device and are
              never uploaded to a Filevra server.
            </p>
          </div>

          <div>
            <h2>Tools</h2>
            <ul>
              <li>
                <Link to="/image-compressor">Image Compressor</Link>
              </li>
              <li>
                <Link to="/photo-signature-resizer">Photo and Signature Resizer</Link>
              </li>
              <li>
                <Link to="/image-to-pdf">Image to PDF</Link>
              </li>
              <li>
                <Link to="/merge-pdf">PDF Merger</Link>
              </li>
              <li>
                <Link to="/compress-pdf">PDF Compressor</Link>
              </li>
            </ul>
          </div>

          <div>
            <h2>Guides</h2>
            <ul>
              <li>
                <Link to="/image-preparation-guide">Image Preparation Guide</Link>
              </li>
              <li>
                <Link to="/pdf-preparation-guide">PDF Preparation Guide</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          <div>
            <h2>Legal</h2>
            <ul>
              <li>
                <Link to="/privacy-policy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms">Terms and Conditions</Link>
              </li>
              {CONTACT_EMAIL ? (
                <li>
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="fr-footer-bottom">
          <span>
            © {year} {SITE_NAME}. All rights reserved.
          </span>
          <span>Built with React, Vite and browser-based file processing.</span>
        </div>
      </div>
    </footer>
  )
}
