import VContainer from '../components/VContainer';
import VHeadline from '../components/VHeadline';
import VMax from '../components/VMax';

const STACK = [
  { label: 'React', detail: 'UI library' },
  { label: 'TypeScript', detail: 'Language' },
  { label: 'Vite', detail: 'Build tool & dev server' },
  { label: 'Tailwind CSS', detail: 'Styling' },
  { label: 'Font Awesome', detail: 'Icons' },
  { label: 'Playwright', detail: 'Headless CV PDF rendering' },
];

export default function PageColophon() {
  return (
    <div className="relative bg-white min-h-screen">
      <VContainer max="lg" className="py-xl">
        <VMax max="sm" className="mx-auto">
          <VHeadline headline="Built With" subline="Colophon" />

          <div className="flex flex-col gap-sm-fixed mt-sm">
            {STACK.map((item) => (
              <div
                key={item.label}
                className="flex items-baseline justify-between border-b border-[#eee] pb-[0.5rem]"
              >
                <div className="font-700">{item.label}</div>
                <div className="text-[0.875rem] text-[#999]">{item.detail}</div>
              </div>
            ))}
          </div>
        </VMax>
      </VContainer>
    </div>
  );
}
