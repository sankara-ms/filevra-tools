import Layout from '../components/Layout/Layout'
import Home from '../pages/Home/Home'
import ToolsPage from '../pages/Tools/ToolsPage'
import ToolPage from '../pages/Tool/ToolPage'
import WorkflowPage from '../pages/Workflow/WorkflowPage'
import { GENERIC_TOOLS } from '../config/toolRegistry'
import ImageCompressor from '../pages/ImageCompressor/ImageCompressor'
import PhotoSignatureResizer from '../pages/PhotoSignatureResizer/PhotoSignatureResizer'
import ImageToPDF from '../pages/ImageToPDF/ImageToPDF'
import PDFMerger from '../pages/PDFMerger/PDFMerger'
import PDFCompressor from '../pages/PDFCompressor/PDFCompressor'
import ImagePreparationGuide from '../pages/ImagePreparationGuide/ImagePreparationGuide'
import PDFPreparationGuide from '../pages/PDFPreparationGuide/PDFPreparationGuide'
import About from '../pages/About/About'
import Contact from '../pages/Contact/Contact'
import PrivacyPolicy from '../pages/PrivacyPolicy/PrivacyPolicy'
import Terms from '../pages/Terms/Terms'
import UsagePage from '../pages/Usage/UsagePage'
import NotFound from '../pages/NotFound/NotFound'

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'tools', element: <ToolsPage /> },
      ...GENERIC_TOOLS.map((tool) => ({
        path: tool.path.replace(/^\//, ''),
        element: <ToolPage tool={tool} />,
      })),
      { path: 'workflow', element: <WorkflowPage /> },
      { path: 'image-compressor', element: <ImageCompressor /> },
      { path: 'photo-signature-resizer', element: <PhotoSignatureResizer /> },
      { path: 'image-to-pdf', element: <ImageToPDF /> },
      { path: 'merge-pdf', element: <PDFMerger /> },
      { path: 'compress-pdf', element: <PDFCompressor /> },
      { path: 'image-preparation-guide', element: <ImagePreparationGuide /> },
      { path: 'pdf-preparation-guide', element: <PDFPreparationGuide /> },
      { path: 'about', element: <About /> },
      { path: 'contact', element: <Contact /> },
      { path: 'privacy-policy', element: <PrivacyPolicy /> },
      { path: 'terms', element: <Terms /> },
      { path: 'usage', element: <UsagePage /> },
      { path: '404', element: <NotFound /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]
