import {
  IconAlertCircle,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconInfoCircle,
  IconMinus,
  IconPhoto,
  IconPlus,
  IconSearch,
  IconShare,
  IconUsers,
  IconX,
  IconClock,
  IconMicrophone,
  IconMicrophoneOff,
  IconArrowLeft,
  IconArrowRight,
  IconList,
  IconChefHat,
  type IconProps,
} from "@tabler/icons-react";

export const ICON_SIZE = 20;
export const ICON_STROKE = 2;

type BisIconProps = Omit<IconProps, "ref">;

export function PhotoIcon(props: BisIconProps) {
  return <IconPhoto size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function CloseIcon(props: BisIconProps) {
  return <IconX size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function ArrowUpIcon(props: BisIconProps) {
  return <IconChevronUp size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function ArrowDownIcon(props: BisIconProps) {
  return <IconChevronDown size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function PlusIcon(props: BisIconProps) {
  return <IconPlus size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function MinusIcon(props: BisIconProps) {
  return <IconMinus size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function SearchIcon(props: BisIconProps) {
  return <IconSearch size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function ShareIcon(props: BisIconProps) {
  return <IconShare size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function SharedIcon(props: BisIconProps) {
  return <IconUsers size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function ErrorIcon(props: BisIconProps) {
  return <IconAlertCircle size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function SuccessIcon(props: BisIconProps) {
  return <IconCircleCheck size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function InfoIcon(props: BisIconProps) {
  return <IconInfoCircle size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function ClockIcon(props: BisIconProps) {
  return <IconClock size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function MicrophoneIcon(props: BisIconProps) {
  return <IconMicrophone size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function MicrophoneOffIcon(props: BisIconProps) {
  return <IconMicrophoneOff size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function ArrowLeftIcon(props: BisIconProps) {
  return <IconArrowLeft size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function ArrowRightIcon(props: BisIconProps) {
  return <IconArrowRight size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function ListIcon(props: BisIconProps) {
  return <IconList size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}

export function ChefIcon(props: BisIconProps) {
  return <IconChefHat size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden {...props} />;
}
