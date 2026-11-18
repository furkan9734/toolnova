import { useEffect, Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import { getToolBySlug } from '../data/toolsRegistry';
import { ToolWorkspace } from '../components/ToolWorkspace';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import NotFoundPage from './NotFoundPage';

const QrCodeGeneratorTool = lazy(() => import('../tools/QrCodeGeneratorTool'));
const ImageCompressorTool = lazy(() => import('../tools/ImageCompressorTool'));
const ImageResizerTool = lazy(() => import('../tools/ImageResizerTool'));
const ImageConverterTool = lazy(() => import('../tools/ImageConverterTool'));
const ImageCropperTool = lazy(() => import('../tools/ImageCropperTool'));
const ImageToPdfTool = lazy(() => import('../tools/ImageToPdfTool'));
const ImageColorPickerTool = lazy(() => import('../tools/ImageColorPickerTool'));
const PdfMergerTool = lazy(() => import('../tools/PdfMergerTool'));
const PdfToImageTool = lazy(() => import('../tools/PdfToImageTool'));
const PdfSplitterTool = lazy(() => import('../tools/PdfSplitterTool'));
const PdfPageOrganizerTool = lazy(() => import('../tools/PdfPageOrganizerTool'));
const WordCounterTool = lazy(() => import('../tools/WordCounterTool'));
const CaseConverterTool = lazy(() => import('../tools/CaseConverterTool'));
const TextCleanerTool = lazy(() => import('../tools/TextCleanerTool'));
const DuplicateLineRemoverTool = lazy(() => import('../tools/DuplicateLineRemoverTool'));
const TextDiffCheckerTool = lazy(() => import('../tools/TextDiffCheckerTool'));
const JsonFormatterTool = lazy(() => import('../tools/JsonFormatterTool'));
const Base64Tool = lazy(() => import('../tools/Base64Tool'));
const UrlEncoderTool = lazy(() => import('../tools/UrlEncoderTool'));
const UuidGeneratorTool = lazy(() => import('../tools/UuidGeneratorTool'));
const PasswordGeneratorTool = lazy(() => import('../tools/PasswordGeneratorTool'));
const PercentageCalculatorTool = lazy(() => import('../tools/PercentageCalculatorTool'));
const AgeCalculatorTool = lazy(() => import('../tools/AgeCalculatorTool'));
const BmiCalculatorTool = lazy(() => import('../tools/BmiCalculatorTool'));
const UnitConverterTool = lazy(() => import('../tools/UnitConverterTool'));
const ImageBackgroundChangerTool = lazy(() => import('../tools/ImageBackgroundChangerTool'));
const ImageWatermarkTool = lazy(() => import('../tools/ImageWatermarkTool'));
const ImageMetadataTool = lazy(() => import('../tools/ImageMetadataTool'));
const FaviconGeneratorTool = lazy(() => import('../tools/FaviconGeneratorTool'));
const ImagePixelatorTool = lazy(() => import('../tools/ImagePixelatorTool'));
const PdfRotatorTool = lazy(() => import('../tools/PdfRotatorTool'));
const PdfPageNumberingTool = lazy(() => import('../tools/PdfPageNumberingTool'));
const PdfWatermarkTool = lazy(() => import('../tools/PdfWatermarkTool'));
const PdfMetadataEditorTool = lazy(() => import('../tools/PdfMetadataEditorTool'));
const PdfPageSizeChangerTool = lazy(() => import('../tools/PdfPageSizeChangerTool'));
const CodeMinifierTool = lazy(() => import('../tools/CodeMinifierTool'));
const CodeBeautifierTool = lazy(() => import('../tools/CodeBeautifierTool'));
const CssGradientGeneratorTool = lazy(() => import('../tools/CssGradientGeneratorTool'));
const ColorPaletteGeneratorTool = lazy(() => import('../tools/ColorPaletteGeneratorTool'));
const HtmlEntityTool = lazy(() => import('../tools/HtmlEntityTool'));
const EmiCalculatorTool = lazy(() => import('../tools/EmiCalculatorTool'));
const CompoundInterestCalculatorTool = lazy(() => import('../tools/CompoundInterestCalculatorTool'));
const GstCalculatorTool = lazy(() => import('../tools/GstCalculatorTool'));
const DiscountCalculatorTool = lazy(() => import('../tools/DiscountCalculatorTool'));
const DateCalculatorTool = lazy(() => import('../tools/DateCalculatorTool'));
const MarkdownEditorTool = lazy(() => import('../tools/MarkdownEditorTool'));
const LoremIpsumGeneratorTool = lazy(() => import('../tools/LoremIpsumGeneratorTool'));
const RandomNumberGeneratorTool = lazy(() => import('../tools/RandomNumberGeneratorTool'));
const StopwatchTool = lazy(() => import('../tools/StopwatchTool'));
const CountdownTimerTool = lazy(() => import('../tools/CountdownTimerTool'));

interface ToolDetailPageProps {
  recordToolVisit: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  onToggleFavorite: (slug: string) => void;
}

export default function ToolDetailPage({
  recordToolVisit,
  isFavorite,
  onToggleFavorite,
}: ToolDetailPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const tool = getToolBySlug(slug);

  useDocumentMeta(
    tool ? tool.seoTitle : 'Tool Not Found | ToolNova',
    tool
      ? tool.seoDescription
      : 'The requested utility could not be found in the ToolNova directory.'
  );

  useEffect(() => {
    if (tool) {
      recordToolVisit(tool.slug);
    }
  }, [tool, recordToolVisit]);

  if (!tool) {
    return <NotFoundPage />;
  }

  const renderToolComponent = () => {
    switch (tool.slug) {
      case 'qr-code-generator':
        return <QrCodeGeneratorTool />;
      case 'image-compressor':
        return <ImageCompressorTool />;
      case 'image-resizer':
        return <ImageResizerTool />;
      case 'image-converter':
        return <ImageConverterTool />;
      case 'image-cropper':
        return <ImageCropperTool />;
      case 'image-to-pdf':
        return <ImageToPdfTool />;
      case 'image-color-picker':
        return <ImageColorPickerTool />;
      case 'pdf-merger':
        return <PdfMergerTool />;
      case 'pdf-to-image':
        return <PdfToImageTool />;
      case 'pdf-splitter':
        return <PdfSplitterTool />;
      case 'pdf-page-organizer':
        return <PdfPageOrganizerTool />;
      case 'word-counter':
        return <WordCounterTool />;
      case 'case-converter':
        return <CaseConverterTool />;
      case 'text-cleaner':
        return <TextCleanerTool />;
      case 'duplicate-line-remover':
        return <DuplicateLineRemoverTool />;
      case 'text-diff-checker':
        return <TextDiffCheckerTool />;
      case 'json-formatter':
        return <JsonFormatterTool />;
      case 'base64-encoder-decoder':
        return <Base64Tool />;
      case 'url-encoder-decoder':
        return <UrlEncoderTool />;
      case 'uuid-generator':
        return <UuidGeneratorTool />;
      case 'password-generator':
        return <PasswordGeneratorTool />;
      case 'percentage-calculator':
        return <PercentageCalculatorTool />;
      case 'age-calculator':
        return <AgeCalculatorTool />;
      case 'bmi-calculator':
        return <BmiCalculatorTool />;
      case 'unit-converter':
        return <UnitConverterTool />;
      case 'image-background-changer':
        return <ImageBackgroundChangerTool />;
      case 'image-watermark-maker':
        return <ImageWatermarkTool />;
      case 'image-metadata-viewer':
        return <ImageMetadataTool />;
      case 'favicon-generator':
        return <FaviconGeneratorTool />;
      case 'image-pixelator':
        return <ImagePixelatorTool />;
      case 'pdf-rotator':
        return <PdfRotatorTool />;
      case 'pdf-page-numbering':
        return <PdfPageNumberingTool />;
      case 'pdf-watermark':
        return <PdfWatermarkTool />;
      case 'pdf-metadata-editor':
        return <PdfMetadataEditorTool />;
      case 'pdf-page-size-changer':
        return <PdfPageSizeChangerTool />;
      case 'code-minifier':
        return <CodeMinifierTool />;
      case 'code-beautifier':
        return <CodeBeautifierTool />;
      case 'css-gradient-generator':
        return <CssGradientGeneratorTool />;
      case 'color-palette-generator':
        return <ColorPaletteGeneratorTool />;
      case 'html-entity-encoder-decoder':
        return <HtmlEntityTool />;
      case 'emi-calculator':
        return <EmiCalculatorTool />;
      case 'compound-interest-calculator':
        return <CompoundInterestCalculatorTool />;
      case 'gst-calculator':
        return <GstCalculatorTool />;
      case 'discount-calculator':
        return <DiscountCalculatorTool />;
      case 'date-calculator':
        return <DateCalculatorTool />;
      case 'markdown-editor':
        return <MarkdownEditorTool />;
      case 'lorem-ipsum-generator':
        return <LoremIpsumGeneratorTool />;
      case 'random-number-generator':
        return <RandomNumberGeneratorTool />;
      case 'stopwatch':
        return <StopwatchTool />;
      case 'countdown-timer':
        return <CountdownTimerTool />;
      default:
        return null;
    }
  };

  return (
    <ToolWorkspace
      tool={tool}
      isFavorite={isFavorite}
      onToggleFavorite={onToggleFavorite}
    >
      <Suspense
        fallback={
          <div className="py-16 flex justify-center">
            <LoadingSpinner label={`Loading ${tool.name}...`} />
          </div>
        }
      >
        {renderToolComponent()}
      </Suspense>
    </ToolWorkspace>
  );
}
