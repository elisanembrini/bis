import { photoUrl } from "../../../api/photos";
import { PhotoInput } from "../../../components/PhotoInput";
import { usePhotoUpload } from "../hooks/usePhotoUpload";

type PhotoFieldProps = {
  label: string;
  photoId: string | null;
  onChange: (photoId: string | null) => void;
  onUploadingChange: (uploading: boolean) => void;
  disabled?: boolean;
};

export function PhotoField({
  label,
  photoId,
  onChange,
  onUploadingChange,
  disabled = false,
}: PhotoFieldProps) {
  const { state, upload, reset } = usePhotoUpload({ onUploaded: onChange, onUploadingChange });
  const imageSrc =
    state.status === "uploading"
      ? state.previewSrc
      : photoId === null
        ? undefined
        : photoUrl(photoId, "thumb");

  return (
    <PhotoInput
      label={label}
      imageSrc={imageSrc}
      progress={state.status === "uploading" ? state.progress : undefined}
      errorCode={state.status === "error" ? state.code : undefined}
      disabled={disabled}
      onSelect={(file) => void upload(file)}
      onRemove={() => {
        reset();
        onChange(null);
      }}
    />
  );
}
