'use client';

export default function Banner({ image, title, text }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 my-15">
      <div
        className="relative rounded-2xl overflow-hidden h-[400px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url('${image}')` }}
      >
        <div className="absolute inset-0 bg-black/50 z-0" />
        <div className="relative z-10 text-center text-white px-6 py-8 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-lg md:text-xl leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}
