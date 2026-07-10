import React from 'react';
import { faArrowRight, faFilePdf } from '@fortawesome/free-solid-svg-icons';

import { config } from '../../config.browser';
import VSwirl from '../components/VSwirl';
import VContainer from '../components/VContainer';
import VOverlay from '../components/VOverlay';
import VFocus from '../components/VFocus';
import VText from '../components/VText';
import VTree from '../components/VTree';
import VAligner from '../components/VAligner';
import VButton from '../components/VButton';
import VIcon from '../components/VIcon';
import VSquare from '../components/VSquare';

interface SectionHeroProps {
  og?: boolean;
}

export default function SectionHero({ og = false }: SectionHeroProps) {
  return (
    <>
      <VSwirl />

      <div id="home" className="relative w-full h-screen">
        <VContainer stretch before={<VOverlay />} after={<VOverlay />}>
          <div className="flex h-full">
            <div className="w-full lg:w-1/2 h-full flex flex-col">
              <VAligner vertical stretch before={<VOverlay />} after={<VOverlay />}>
                <VAligner sm="start" before={<VOverlay />} after={<VOverlay />}>
                  <VFocus label={config.content.hero.focus} />
                </VAligner>

                <div className="relative flex flex-col items-center sm:items-start">
                  <VOverlay />

                  <div className="relative flex flex-col items-center sm:items-start">
                    <div className="max-w-[27rem] text-xs text-center sm:text-left my-lg">
                      <VText
                        text={config.content.hero.headline}
                        params={{ yearsOfExperience: config.yearsOfExperience }}
                      />
                    </div>

                    {!og && (
                      <div className="flex flex-wrap justify-center sm:justify-start gap-[0.5rem]">
                        <VButton
                          label="Download CV"
                          icon={<VIcon icon={faFilePdf} />}
                          iconPosition="leading"
                          href="/tony-bogdanov-cv.pdf"
                          download={!import.meta.env.DEV}
                        />
                        <VButton
                          label="Reach Out"
                          icon={<VIcon icon={faArrowRight} />}
                          variant="ghost"
                          href="#contact"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </VAligner>
            </div>

            <div className="relative hidden lg:flex lg:w-1/2 h-full items-center">
              <VOverlay />

              <VSquare>
                <VTree frozen={og} />
              </VSquare>
            </div>
          </div>
        </VContainer>
      </div>
    </>
  );
}
