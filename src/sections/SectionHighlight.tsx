import { faAt } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedinIn, faUpwork } from '@fortawesome/free-brands-svg-icons';
import cx from 'classnames';

import { config } from '../../config.browser';
import { faResume } from '../icons';
import { BaseProp } from '../utils/base-props';
import wave from '../assets/wave.svg';
import VContainer from '../components/VContainer';
import VIcon from '../components/VIcon';
import VPattern from '../components/VPattern';
import useRevealableEmail from '../hooks/useRevealableEmail';

const LINK_CLASSES = cx(
  'flex items-center justify-center text-[#999] hover:text-white w-[3rem] h-[3rem] rounded-2 hover:bg-[#444]',
  'transition duration-150 hover:duration-0'
);

export default function SectionHighlight({ className }: BaseProp) {
  const { profile } = config.content;
  const { email, ref: emailRef } = useRevealableEmail<HTMLAnchorElement>();

  return (
    <div className={cx('relative overflow-hidden py-[0.75rem] bg-[#333]', className)}>
      <VPattern svg={wave} color="#2c2c2c" />
      <div className="absolute top-0 left-0 right-0 h-[1.5rem] bg-gradient-to-b from-black/15 to-transparent" />

      <VContainer max="lg" className="text-white text-center">
        <div className="flex items-center justify-center gap-xs text-[1.5rem]">
          <a
            ref={emailRef}
            href={email ? `mailto:${email}` : undefined}
            target="_blank"
            rel="noopener noreferrer"
            title="Email"
            aria-label="Email"
            className={LINK_CLASSES}
          >
            <VIcon icon={faAt} />
          </a>

          {config.features.github && (
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              aria-label="GitHub"
              className={LINK_CLASSES}
            >
              <VIcon icon={faGithub} />
            </a>
          )}

          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
            aria-label="LinkedIn"
            className={LINK_CLASSES}
          >
            <VIcon icon={faLinkedinIn} />
          </a>

          {config.features.upwork && (
            <a
              href="/upwork"
              target="_blank"
              rel="noopener noreferrer"
              title="Upwork"
              aria-label="Upwork"
              className={LINK_CLASSES}
            >
              <VIcon icon={faUpwork} />
            </a>
          )}

          <a
            href="/tony-bogdanov-cv.pdf"
            download={!import.meta.env.DEV}
            title="Download CV"
            aria-label="Download CV"
            className={LINK_CLASSES}
          >
            <VIcon icon={faResume} />
          </a>
        </div>
      </VContainer>
    </div>
  );
}
