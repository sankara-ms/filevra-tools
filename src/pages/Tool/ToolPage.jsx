import { Link } from 'react-router-dom'
import SEO from '../../components/SEO/SEO'
import ToolPageShell from '../../components/ToolPageShell/ToolPageShell'
import ToolRunner from '../../components/ToolRunner/ToolRunner'
import { CATEGORY_BY_ID } from '../../config/toolRegistry'
import { faqJsonLd, webAppJsonLd } from '../../utils/schema'

export default function ToolPage({ tool }) {
  const category = CATEGORY_BY_ID[tool.category]
  const isTextTool = Boolean(tool.input)
  const maxMb = Math.round((tool.maxBytes || 100 * 1024 * 1024) / (1024 * 1024))
  const maxFiles = tool.maxFiles || (tool.multiple ? 20 : 1)

  const facts = [
    tool.formats?.output ? `Output: ${tool.formats.output}` : 'Works with the files you add',
    isTextTool ? 'Type or paste, no file needed' : `Up to ${maxMb} MB per file`,
    'Runs locally in this browser tab',
    'Free, no account and no watermark',
  ]

  const steps = [
    {
      title: isTextTool ? 'Add your text' : tool.multiple ? 'Add the files' : 'Add the file',
      text: isTextTool
        ? 'Paste the content into the box. Nothing is sent anywhere while you type.'
        : `Drop the file on the workspace or browse your device. ${tool.multiple ? `You can add up to ${maxFiles} files per run.` : 'The file is checked for type and size before it is used.'}`,
    },
    {
      title: 'Set the options',
      text: (tool.fields || []).length
        ? 'Adjust the settings for this tool. The defaults work for most jobs.'
        : 'There is nothing to configure: the tool uses sensible defaults.',
    },
    {
      title: 'Run and download',
      text: 'The result is created in this tab and offered as a download. Multi-file results can also be saved as one ZIP.',
    },
  ]

  const formats = [
    { label: 'Input', value: tool.formats?.input || (isTextTool ? 'Typed or pasted text' : 'Any file type') },
    { label: 'Output', value: tool.formats?.output || 'Files created in the browser' },
    { label: 'Maximum input size', value: `${maxMb} MB per file` },
    { label: 'Files per run', value: tool.multiple ? `Up to ${maxFiles}` : 'One at a time' },
    { label: 'Processing', value: 'Inside this browser tab, on your device' },
  ]

  const limits = [
    ...(tool.limits || []),
    'Very large files are limited by the memory available to the browser tab, especially on phones.',
  ]

  const faqs = [
    {
      question: `Are my files uploaded when I use the ${tool.name.toLowerCase()}?`,
      answer:
        'No. The tool reads the file with JavaScript in this browser tab and builds the result in the same tab. There is no upload step, no Filevra storage and no document history.',
    },
    {
      question: 'Does it work on a phone?',
      answer:
        'Yes, in recent versions of Chrome, Edge, Firefox and Safari. Very large files are easier on a computer because phones have less working memory.',
    },
    {
      question: `What are the limits of the ${tool.name.toLowerCase()}?`,
      answer: `${(tool.limits || []).join(' ') || `Each input can be up to ${maxMb} MB.`} Browser memory is the practical limit for long documents and high-resolution images.`,
    },
    {
      question: 'Is it free, and do I need an account?',
      answer:
        'The tool is free to use, without an account, email address or watermark. After the first visit the application shell is cached, so cached tools keep working without a connection.',
    },
  ]

  return (
    <>
      <SEO
        title={tool.seoTitle || `${tool.name} - Free Browser Tool | Filevra`}
        description={`${tool.description} Runs entirely in your browser: no upload, no account, no watermark.`}
        path={tool.path}
        jsonLd={[
          webAppJsonLd({
            name: `Filevra ${tool.name}`,
            description: tool.description,
            path: tool.path,
          }),
          faqJsonLd(faqs),
        ]}
      />
      <ToolPageShell
        tool={tool}
        title={tool.name}
        intro={tool.description}
        facts={facts}
        steps={steps}
        formats={formats}
        limits={limits}
        faqs={faqs}
        about={
          <>
            <h2>What this tool does</h2>
            <p>
              {tool.description} It is part of the {category ? <Link to={`/tools?category=${category.id}`}>{category.name}</Link> : 'Filevra toolkit'} and follows the same rule as every
              other tool here: the file is processed on your device.
            </p>
            <h2>How it works in the browser</h2>
            <p>
              Filevra loads the processing code only when you run the tool. The file is read from your device, handled
              with open JavaScript libraries in this tab, and the result is offered as a download. Closing or reloading
              the page discards the working data.
            </p>
            <h2>What to check in the result</h2>
            <p>
              Open the downloaded file once before you rely on it. Conversion always has trade-offs: text may stop
              being selectable, complex layouts can shift, and fonts may differ from the original. When a feature
              cannot be reproduced faithfully, the tool says so before and after the run instead of hiding it.
            </p>
          </>
        }
      >
        <ToolRunner tool={tool} />
      </ToolPageShell>
    </>
  )
}
