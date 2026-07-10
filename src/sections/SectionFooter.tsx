import { faAt, faHeart } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedinIn, faUpwork } from '@fortawesome/free-brands-svg-icons';
import cx from 'classnames';

import { config } from '../../config.browser';
import { faResume } from '../icons';
import { BaseProp } from '../utils/base-props';
import favicon from '../assets/favicon.svg';
import useRevealableEmail from '../hooks/useRevealableEmail';
import VContainer from '../components/VContainer';
import VIcon from '../components/VIcon';

export default function SectionFooter({ className }: BaseProp) {
  const { profile } = config.content;
  const { email, ref: emailRef } = useRevealableEmail<HTMLAnchorElement>();

  const NAV_LINKS = [
    { label: 'About', href: '#about' },
    { label: 'Timeline', href: '#timeline' },
    { label: 'Skills', href: '#skills' },
  ];

  const MORE_LINKS = [
    { label: 'Download CV', href: '/tony-bogdanov-cv.pdf', download: !import.meta.env.DEV },
    { label: 'Colophon', href: '/colophon', download: false },
  ];

  const SOCIAL_LINKS = [
    ...(config.features.github ? [{ label: 'GitHub', icon: faGithub, href: profile.github }] : []),
    { label: 'LinkedIn', icon: faLinkedinIn, href: profile.linkedin },
    ...(config.features.upwork ? [{ label: 'Upwork', icon: faUpwork, href: '/upwork' }] : []),
    { label: 'Download CV', icon: faResume, href: '/tony-bogdanov-cv.pdf' },
  ];

  return (
    <div className={cx('relative z-0 bg-[#f8f8f8]', className)}>
      <VContainer max="lg" className="py-md">
        <div className="flex flex-col items-center sm:items-stretch sm:flex-row justify-between gap-xs lg:gap-xl">
          <div className="w-full lg:w-[40%] text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-[0.75rem] font-700 leading-[2rem] mb-xs-fixed">
              <img src={favicon} alt="" className="w-[2rem] h-[2rem] shrink-0" />
              <div>{profile.name}</div>
            </div>

            <div className="text-[0.875rem] text-[#999] leading-[1.5] mb-xs-fixed max-w-[24rem]">
              {profile.title} from {profile.location} ({profile.timezone}).
              <br />
              {profile.availabilityExtended}.
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-[1rem] text-[1.125rem]">
              <a
                ref={emailRef}
                href={email ? `mailto:${email}` : undefined}
                target="_blank"
                rel="noopener noreferrer"
                title="Email"
                aria-label="Email"
              >
                <VIcon icon={faAt} />
              </a>
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.label}
                  aria-label={link.label}
                >
                  <VIcon icon={link.icon} />
                </a>
              ))}
            </div>
          </div>

          <div className="flex justify-center sm:justify-start gap-lg sm:gap-xl whitespace-nowrap text-center sm:text-left">
            <div>
              <div className="font-700 leading-[2rem] mb-xs-fixed">Navigate</div>
              <div className="flex flex-col gap-[0.625rem] text-[0.875rem] text-[#999]">
                {NAV_LINKS.map((link) => (
                  <div key={link.label}>
                    <a href={link.href} className="hover:text-blue-d25 hover:underline">
                      {link.label}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-700 leading-[2rem] mb-xs-fixed">More</div>
              <div className="flex flex-col gap-[0.625rem] text-[0.875rem] text-[#999]">
                {MORE_LINKS.map((link) =>
                  link.href ?
                    <div key={link.label}>
                      <a href={link.href} download={link.download} className="hover:text-blue-d25 hover:underline">
                        {link.label}
                      </a>
                    </div>
                  : <div key={link.label}>{link.label}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <hr className="w-full h-[0.0625rem] mx-0 my-xs border-0 bg-[#eee]" />

        <div className="flex flex-col sm:flex-row items-center justify-between sm:gap-xs text-[0.75rem] text-[#999]">
          <div>&copy; {new Date().getFullYear()} &mdash; All rights reserved.</div>
          {config.features.github ?
            <a
              href={`${profile.github}/tonybogdanov`}
              target="_blank"
              rel="noopener noreferrer"
              title="View source on GitHub"
              className="hover:text-blue-d25"
            >
              Built with <VIcon icon={faHeart} className="text-red" />
            </a>
          : <div>
              Built with <VIcon icon={faHeart} className="text-red" />
            </div>
          }
        </div>
      </VContainer>
    </div>
  );
}
