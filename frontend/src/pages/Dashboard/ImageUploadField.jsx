import { useEffect, useState } from 'react';

export default function ImageUploadField({ language, currentUrl }) {
  const [preview, setPreview] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const ar = language === 'ar';
  return <label className="dash-field--full">
    {ar ? 'أو ارفع صورة من جهازك' : 'Or upload an image from your device'}
    <span className="dash-upload-control">
      <span className="dash-file-trigger">{ar ? 'اختيار صورة' : 'Choose image'}</span>
      <span className="dash-file-name" aria-live="polite">{fileName || (ar ? 'لم تُحدَّد صورة' : 'No image selected')}</span>
      <input className="dash-file-input" name="image_file" type="file" accept="image/jpeg,image/png,image/webp" aria-label={ar ? 'اختيار صورة من الجهاز' : 'Choose an image from your device'} onChange={(event) => {
        const file = event.target.files?.[0];
        setFileName(file?.name || '');
        setPreview(file ? URL.createObjectURL(file) : '');
      }} />
    </span>
    <span className="dash-secondary">{ar
      ? 'JPEG أو PNG أو WebP، حتى 5 ميغابايت. الصورة المرفوعة عامة وتحل محل الرابط عند الحفظ.'
      : 'JPEG, PNG, or WebP, up to 5 MB. Uploaded images are public and replace the URL when saved.'}</span>
    {(preview || currentUrl) && <img className="dash-image-preview" src={preview || currentUrl}
      alt={ar ? 'معاينة الصورة' : 'Image preview'} />}
  </label>;
}
