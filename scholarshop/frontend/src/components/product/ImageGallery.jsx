import React, { useState } from 'react';
import { imageUrl } from '../../utils/formatters';

export default function ImageGallery({ images = [], title }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-slate-100 rounded-xl grid place-items-center text-slate-400">
        No image
      </div>
    );
  }
  const main = images[active] || images[0];
  return (
    <div>
      <div className="aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden">
        <img src={imageUrl(main.url)} alt={title} className="w-full h-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
                    className={'aspect-square rounded-lg overflow-hidden border ' +
                      (i === active ? 'border-brand-600 ring-2 ring-brand-200' : 'border-slate-200')}>
              <img src={imageUrl(img.url)} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
