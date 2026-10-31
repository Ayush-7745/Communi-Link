import { useEffect, useState } from 'react';
import { Issue } from '../../types/issue';
import { api } from '../../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface ImageItem {
  key: string;
  label: string;
  url?: string;
}

export function IssueImageGallery({ issue }: { issue: Issue }) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const requestedImages: ImageItem[] = [];

    if (issue.imageBlob) requestedImages.push({ key: `issue-${issue.imageBlob}`, label: 'Reported image' });
    else if (issue.imageUrl) requestedImages.push({ key: `issue-${issue.imageUrl}`, label: 'Reported image', url: issue.imageUrl });

    if (issue.completionProofBlob) {
      requestedImages.push({ key: `completion-${issue.completionProofBlob}`, label: 'Completion proof' });
    } else {
      issue.proofImages?.forEach((url, index) => {
        requestedImages.push({ key: `legacy-proof-${index}-${url}`, label: `Completion proof ${index + 1}`, url });
      });
    }

    setImages([]);
    if (requestedImages.some((image) => !image.url)) setLoading(true);

    void Promise.all(requestedImages.map(async (image) => {
      if (image.url) return image;
      try {
        const signed = await api.getUploadUrl(image.key.replace(/^(issue|completion)-/, ''));
        return { ...image, url: signed.url };
      } catch (error) {
        console.error('Unable to load issue image:', error);
        return image;
      }
    })).then((resolved) => {
      if (!active) return;
      setImages(resolved);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [issue.imageBlob, issue.imageUrl, issue.completionProofBlob, issue.proofImages]);

  if (!issue.imageBlob && !issue.imageUrl && !issue.completionProofBlob && !issue.proofImages?.length) {
    return null;
  }

  const reportedImages = images.filter((image) => image.label === 'Reported image');
  const completionImages = images.filter((image) => image.label.startsWith('Completion proof'));

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 space-y-5`}>
      {[
        { title: 'Reported Images', items: reportedImages },
        { title: 'Completion Proof', items: completionImages },
      ].map(({ title, items }) => {
        const hasStoredImage = title === 'Reported Images'
          ? Boolean(issue.imageBlob || issue.imageUrl)
          : Boolean(issue.completionProofBlob || issue.proofImages?.length);
        if (!hasStoredImage) return null;

        return (
          <section key={title}>
            <h2 className={`text-lg ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-3`}>{title}</h2>
            {loading && items.length === 0 && (
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading image preview…</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((image) => image.url ? (
                <a
                  key={image.key}
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg overflow-hidden border border-slate-200"
                  aria-label={`Open ${image.label}`}
                >
                  <img src={image.url} alt={image.label} className="w-full max-h-80 object-contain bg-slate-50" />
                </a>
              ) : (
                <p key={image.key} className="text-sm text-red-600">
                  Unable to load this image. Please refresh and try again.
                </p>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
