import { Link } from 'react-router-dom'
import SEO from '../../components/SEO/SEO'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import { CONTACT_EMAIL, SITE_NAME } from '../../config/site'

const EFFECTIVE = '25 November 2026'

export default function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="Privacy Policy - How Filevra Handles Your Files"
        description="Filevra processes images and PDFs in your browser. This policy explains local processing, the service worker cache, hosting logs, advertising consent and your choices."
        path="/privacy-policy"
      />

      <div className="fr-page-head">
        <div className="fr-container">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Privacy Policy' }]} />
          <h1>Privacy Policy</h1>
          <p>Effective date: {EFFECTIVE}</p>
        </div>
      </div>

      <section className="fr-section">
        <div className="fr-container">
          <div className="fr-prose">
            <h2>The short version</h2>
            <p>
              {SITE_NAME} processes your images and PDFs inside your browser. The files are not uploaded, not stored on
              a server and not sent to analytics or advertising services. There are no accounts. The only preference
              saved in your browser is an advertising consent choice, and only when advertising is enabled.
            </p>

            <h2>Files you process</h2>
            <p>
              When you select a file, the browser reads it from your device and provides it to the page you are using.
              Image tools draw the file to a canvas; PDF tools read it with a bundled library and assemble the result in
              memory. The finished file is offered to you as a download.
            </p>
            <ul>
              <li>No request containing your document is sent to {SITE_NAME} or to a third party.</li>
              <li>No copy of your document is written to a database or object store.</li>
              <li>Temporary in-memory URLs are released when you reset the tool or leave the page.</li>
              <li>Your document is never written to localStorage, IndexedDB or the service worker cache.</li>
            </ul>
            <p>
              As with any web page, closing or reloading the tab discards the working data. Your original file on disk
              is never modified; the tools only read it.
            </p>

            <h2>What is stored on your device</h2>
            <p>
              <strong>Advertising consent.</strong> If advertising is enabled, the site stores your choice (allow or
              decline) in your browser’s localStorage under the key <span className="fr-mono">filevra-ad-consent-v1</span>.
              It contains no document data and no identifier that links you to a file.
            </p>
            <p>
              <strong>Application cache.</strong> A service worker stores the site’s own pages, styles, scripts and icons
              so the tools work offline. It does not cache your documents and does not cache advertising scripts. You
              can remove it by clearing site data for this domain in your browser settings.
            </p>
            <p>
              Clearing site data removes the consent choice as well, so the consent notice may appear again on a later
              visit.
            </p>

            <h2>Hosting and technical logs</h2>
            <p>
              The site is served as static files by Cloudflare Pages. Like any hosting provider, Cloudflare may process
              standard technical information to deliver the site and protect it from abuse, such as the requested URL,
              IP address, user agent, approximate location derived from the IP address, and timestamps. {SITE_NAME} does
              not use this information to identify visitors, and does not combine it with document data, because no
              document data reaches the server.
            </p>
            <p>
              Cloudflare’s own handling of technical data is governed by Cloudflare’s privacy policy. Requests for the
              advertising script, when advertising is enabled and permitted, are made directly from your browser to
              Google and are subject to Google’s policies.
            </p>

            <h2>Advertising</h2>
            <p>
              Advertising is used, if at all, to cover hosting costs. Advertising scripts are not loaded while no
              publisher account is configured. Where advertising is enabled, Google AdSense may set cookies or use local
              storage to measure and personalise ads, and may receive technical information such as your IP address and
              the page you are viewing.
            </p>
            <ul>
              <li>Advertising scripts load only after you choose “Allow advertising”.</li>
              <li>Declining keeps the tools fully usable; no advertising script is loaded.</li>
              <li>Your files, their names and their contents are never available to the advertising script.</li>
              <li>Ads are placed away from upload, compress and download controls to avoid accidental clicks.</li>
            </ul>
            <p>
              Google’s handling of advertising data is described in Google’s privacy and advertising policies. You can
              also manage personalised advertising through your Google account settings.
            </p>

            <h2>Analytics</h2>
            <p>
              This deployment does not load a third-party analytics product. No heatmaps, session recordings or
              cross-site tracking pixels are used. If that changes, this policy will be updated before the change takes
              effect.
            </p>

            <h2>Third-party software</h2>
            <p>
              The tools use open-source JavaScript libraries that are bundled with the site and served from the same
              domain, including PDF.js, pdf-lib and standard browser APIs. They do not make independent network requests
              that contain your documents.
            </p>

            <h2>Children</h2>
            <p>
              The site is a general-purpose utility and is not directed at children. It collects no personal information
              and requires no account, so there is no child-specific data to manage.
            </p>

            <h2>Your choices and rights</h2>
            <p>
              Because no account or server-side document store exists, there is no personal profile to access, export or
              delete. You can withdraw advertising consent by clearing site data for this domain, which removes the
              stored choice. If you are in a region with statutory data protection rights and have a question about
              technical logs processed by the hosting provider, use the <Link to="/contact">contact page</Link>.
            </p>

            <h2>Changes to this policy</h2>
            <p>
              The policy may be updated when the site changes — for example, if advertising is enabled for the first
              time or a new tool is added. The effective date at the top of this page will change accordingly.
            </p>

            <h2>Contact</h2>
            <p>
              Privacy questions can be sent through the <Link to="/contact">contact page</Link>
              {CONTACT_EMAIL ? (
                <>
                  {' '}
                  or by email to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </>
              ) : null}
              . Please do not include personal documents in a message.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
