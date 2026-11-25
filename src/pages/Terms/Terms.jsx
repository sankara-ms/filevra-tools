import { Link } from 'react-router-dom'
import SEO from '../../components/SEO/SEO'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import { SITE_NAME } from '../../config/site'

const EFFECTIVE = '25 November 2026'

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms and Conditions - Using Filevra Tools"
        description="The terms that apply when you use Filevra: acceptable use, your responsibility for files and results, no warranty, and limits of liability."
        path="/terms"
      />

      <div className="fr-page-head">
        <div className="fr-container">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Terms and Conditions' }]} />
          <h1>Terms and Conditions</h1>
          <p>Effective date: {EFFECTIVE}</p>
        </div>
      </div>

      <section className="fr-section">
        <div className="fr-container">
          <div className="fr-prose">
            <h2>1. Agreement</h2>
            <p>
              By using {SITE_NAME}, you agree to these terms. If you do not agree, please do not use the site. These
              terms apply to every tool, guide and page on the site.
            </p>

            <h2>2. What the service is</h2>
            <p>
              {SITE_NAME} provides free, browser-based utilities for preparing images and PDF files. Processing happens
              on your device. The site does not provide storage, accounts, document management or professional advice.
              It is offered as a convenience tool, not as a critical service.
            </p>

            <h2>3. Your files and your responsibilities</h2>
            <ul>
              <li>You must have the right to use and modify any file you process.</li>
              <li>You are responsible for keeping backups of your original files.</li>
              <li>You are responsible for checking that a result meets the requirements of its destination.</li>
              <li>You should not rely on a processed file as the only copy of an important document.</li>
            </ul>
            <p>
              {SITE_NAME} does not receive your files, but it also cannot recover a file that you overwrite, lose or
              fail to download.
            </p>

            <h2>4. Acceptable use</h2>
            <p>You agree not to use the site to:</p>
            <ul>
              <li>process content that is unlawful or that you have no permission to use;</li>
              <li>create documents intended to deceive, forge or defraud;</li>
              <li>attempt to disrupt, overload, scrape at scale or interfere with the site or its hosting;</li>
              <li>circumvent technical protections, or use automated means to attack the service;</li>
              <li>misrepresent a processed file as an unmodified original where that matters.</li>
            </ul>
            <p>
              Access may be restricted where use threatens the availability or security of the site or violates
              applicable law.
            </p>

            <h2>5. Results are not guaranteed</h2>
            <p>
              File processing depends on your browser, device memory, the source file and the format itself. A target
              file size may not be reachable, a PDF may be unreadable if it is damaged or encrypted, and a portal may
              reject a result for reasons outside the site’s control. Where a tool cannot achieve a requested outcome,
              it aims to say so plainly rather than present a misleading success.
            </p>
            <p>
              The guides describe general practice. They are not a statement of any organisation’s requirements, and
              they are not legal, immigration, employment or professional advice. Always follow the instructions you
              were given.
            </p>

            <h2>6. Intellectual property</h2>
            <p>
              You keep all rights to the files you process and to the results you create. The site’s own text, design
              and code are protected by their respective licences and may not be copied wholesale for another service.
              Open-source libraries remain under their own licences.
            </p>

            <h2>7. Advertising and third-party links</h2>
            <p>
              If advertising is enabled, ads are supplied by third parties and are clearly separated from tool controls.
              {SITE_NAME} does not control the content of third-party advertisements and is not responsible for the
              products or sites they promote. Links to external resources are provided for convenience; their content
              and policies are outside this site’s control.
            </p>

            <h2>8. Availability</h2>
            <p>
              The site is provided free of charge and may change, be suspended or be discontinued at any time. No
              uptime guarantee is given. Offline use depends on your browser retaining the cached application.
            </p>

            <h2>9. Disclaimer of warranties</h2>
            <p>
              To the fullest extent permitted by applicable law, the site and its tools are provided “as is” and “as
              available”, without warranties of any kind, whether express or implied, including fitness for a particular
              purpose, accuracy, or non-infringement. Nothing in these terms excludes rights that cannot legally be
              excluded.
            </p>

            <h2>10. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by applicable law, {SITE_NAME} and its operator are not liable for indirect,
              incidental, special or consequential losses, or for lost data, lost documents, rejected applications or
              lost profits arising from use of the site. Where liability cannot be excluded, it is limited to the amount
              you paid to use the service, which is zero.
            </p>

            <h2>11. Privacy</h2>
            <p>
              Handling of technical data, local storage and advertising consent is described in the{' '}
              <Link to="/privacy-policy">privacy policy</Link>, which forms part of these terms.
            </p>

            <h2>12. Changes</h2>
            <p>
              These terms may be updated as the service changes. The effective date at the top of the page will be
              revised. Continued use after a change means you accept the updated terms.
            </p>

            <h2>13. Governing law</h2>
            <p>
              These terms are governed by the laws applicable to the operator of this site, without regard to
              conflict-of-law rules. Courts with jurisdiction over the operator may hear disputes. This choice does not
              remove any mandatory consumer protection you have where you live.
            </p>

            <h2>14. Contact</h2>
            <p>
              Questions about these terms can be sent through the <Link to="/contact">contact page</Link>. Please do not
              include personal documents.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
