import {
  QrCode,
  Minimize2,
  Maximize2,
  RefreshCw,
  Files,
  FileImage,
  FileText,
  CaseSensitive,
  KeyRound,
  Percent,
  Crop,
  FilePlus2,
  Pipette,
  Scissors,
  LayoutGrid,
  Eraser,
  ListFilter,
  GitCompare,
  Braces,
  Binary,
  Link2,
  Fingerprint,
  Cake,
  Scale,
  ArrowLeftRight,
  Layers,
  Stamp,
  FileSearch,
  AppWindow,
  Grid3x3,
  RotateCw,
  Hash,
  FileBadge,
  FileCog,
  Scaling,
  FileCode,
  IndentIncrease,
  Palette,
  SwatchBook,
  Code2,
  Landmark,
  TrendingUp,
  Receipt,
  Tag,
  CalendarDays,
  FileEdit,
  AlignLeft,
  Dices,
  Timer,
  Hourglass,
} from 'lucide-react';
import type { ToolDefinition } from '../data/toolsRegistry';

interface ToolIconProps {
  name: ToolDefinition['iconName'];
  className?: string;
}

export function ToolIcon({ name, className = 'w-5 h-5' }: ToolIconProps) {
  switch (name) {
    case 'QrCode':
      return <QrCode className={className} aria-hidden="true" />;
    case 'Minimize2':
      return <Minimize2 className={className} aria-hidden="true" />;
    case 'Maximize2':
      return <Maximize2 className={className} aria-hidden="true" />;
    case 'RefreshCw':
      return <RefreshCw className={className} aria-hidden="true" />;
    case 'Files':
      return <Files className={className} aria-hidden="true" />;
    case 'FileImage':
      return <FileImage className={className} aria-hidden="true" />;
    case 'FileText':
      return <FileText className={className} aria-hidden="true" />;
    case 'CaseSensitive':
      return <CaseSensitive className={className} aria-hidden="true" />;
    case 'KeyRound':
      return <KeyRound className={className} aria-hidden="true" />;
    case 'Percent':
      return <Percent className={className} aria-hidden="true" />;
    case 'Crop':
      return <Crop className={className} aria-hidden="true" />;
    case 'FilePlus2':
      return <FilePlus2 className={className} aria-hidden="true" />;
    case 'Pipette':
      return <Pipette className={className} aria-hidden="true" />;
    case 'Scissors':
      return <Scissors className={className} aria-hidden="true" />;
    case 'LayoutGrid':
      return <LayoutGrid className={className} aria-hidden="true" />;
    case 'Eraser':
      return <Eraser className={className} aria-hidden="true" />;
    case 'ListFilter':
      return <ListFilter className={className} aria-hidden="true" />;
    case 'GitCompare':
      return <GitCompare className={className} aria-hidden="true" />;
    case 'Braces':
      return <Braces className={className} aria-hidden="true" />;
    case 'Binary':
      return <Binary className={className} aria-hidden="true" />;
    case 'Link2':
      return <Link2 className={className} aria-hidden="true" />;
    case 'Fingerprint':
      return <Fingerprint className={className} aria-hidden="true" />;
    case 'Cake':
      return <Cake className={className} aria-hidden="true" />;
    case 'Scale':
      return <Scale className={className} aria-hidden="true" />;
    case 'ArrowLeftRight':
      return <ArrowLeftRight className={className} aria-hidden="true" />;
    case 'Layers':
      return <Layers className={className} aria-hidden="true" />;
    case 'Stamp':
      return <Stamp className={className} aria-hidden="true" />;
    case 'FileSearch':
      return <FileSearch className={className} aria-hidden="true" />;
    case 'AppWindow':
      return <AppWindow className={className} aria-hidden="true" />;
    case 'Grid3x3':
      return <Grid3x3 className={className} aria-hidden="true" />;
    case 'RotateCw':
      return <RotateCw className={className} aria-hidden="true" />;
    case 'Hash':
      return <Hash className={className} aria-hidden="true" />;
    case 'FileBadge':
      return <FileBadge className={className} aria-hidden="true" />;
    case 'FileCog':
      return <FileCog className={className} aria-hidden="true" />;
    case 'Scaling':
      return <Scaling className={className} aria-hidden="true" />;
    case 'FileCode':
      return <FileCode className={className} aria-hidden="true" />;
    case 'IndentIncrease':
      return <IndentIncrease className={className} aria-hidden="true" />;
    case 'Palette':
      return <Palette className={className} aria-hidden="true" />;
    case 'SwatchBook':
      return <SwatchBook className={className} aria-hidden="true" />;
    case 'Code2':
      return <Code2 className={className} aria-hidden="true" />;
    case 'Landmark':
      return <Landmark className={className} aria-hidden="true" />;
    case 'TrendingUp':
      return <TrendingUp className={className} aria-hidden="true" />;
    case 'Receipt':
      return <Receipt className={className} aria-hidden="true" />;
    case 'Tag':
      return <Tag className={className} aria-hidden="true" />;
    case 'CalendarDays':
      return <CalendarDays className={className} aria-hidden="true" />;
    case 'FileEdit':
      return <FileEdit className={className} aria-hidden="true" />;
    case 'AlignLeft':
      return <AlignLeft className={className} aria-hidden="true" />;
    case 'Dices':
      return <Dices className={className} aria-hidden="true" />;
    case 'Timer':
      return <Timer className={className} aria-hidden="true" />;
    case 'Hourglass':
      return <Hourglass className={className} aria-hidden="true" />;
  }
}
