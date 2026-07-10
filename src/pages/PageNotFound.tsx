import { faArrowLeftLong } from '@fortawesome/free-solid-svg-icons';

import VButton from '../components/VButton';
import VContainer from '../components/VContainer';
import VHeadline from '../components/VHeadline';
import VIcon from '../components/VIcon';
import VMax from '../components/VMax';

export default function PageNotFound() {
  return (
    <div className="relative bg-white min-h-screen">
      <VContainer max="lg" className="py-xl">
        <VMax max="sm" className="mx-auto">
          <VHeadline headline="Page Not Found" subline="404" />

          <div className="mt-sm">
            <VButton
              label="Back home"
              icon={<VIcon icon={faArrowLeftLong} />}
              iconPosition="leading"
              href="/"
            />
          </div>
        </VMax>
      </VContainer>
    </div>
  );
}
