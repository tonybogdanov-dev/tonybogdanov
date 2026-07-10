import { type ReactNode } from 'react';
import { faLocationDot, faBriefcase, faEnvelope, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faUpwork } from '@fortawesome/free-brands-svg-icons';
import { type IconDefinition } from '@fortawesome/fontawesome-common-types';
import cx from 'classnames';

import { config } from '../../config.browser';
import { shortUrl } from '../utils/url';
import logo from '../assets/logo-signature.svg';
import VText from '../components/VText';
import VIcon from '../components/VIcon';
import useRevealableEmail from '../hooks/useRevealableEmail';

function Block({ compact, children, className }: { compact?: boolean; children: ReactNode; className?: string }) {
  return <div className={cx(compact ? 'my-[8px]' : 'my-[24px]', className)}>{children}</div>;
}

function Headline({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cx(
        'uppercase font-700 px-[0.5em] text-[13px] leading-[2] bg-[#eee] border-b-2 border-blue',
        className
      )}
    >
      {label}
    </div>
  );
}

function Subline({ label, meta, className }: { label: string; meta?: string | ReactNode; className?: string }) {
  return (
    <div className={cx('flex', className)}>
      <div className="font-700 grow">{label}</div>
      <div className="text-[#bbb] shrink-0 whitespace-nowrap">{meta}</div>
    </div>
  );
}

function Venue({ label, className }: { label: string; className?: string }) {
  return <div className={cx('text-blue-d25', className)}>{label}</div>;
}

function Meta({ icon, className, children }: { icon?: IconDefinition; className?: string; children: ReactNode }) {
  return (
    <div className={cx('text-[12px]', className)}>
      {icon && (
        <div className="inline-flex items-center justify-center w-[1em] h-[1em] mr-[0.5em]">
          <VIcon icon={icon} className="text-[#bbb]" />
        </div>
      )}
      {children}
    </div>
  );
}

function Range({ start, end }: { start: number; end?: number }) {
  return (
    <div className="text-[#bbb]">
      {start} &mdash; {end ?? 'Present'}
    </div>
  );
}

function Pills({ labels, className }: { labels: string[]; className?: string }) {
  return (
    <div className="flex flex-wrap gap-[4px] text-[11px]">
      {labels.map((label, i) => (
        <div
          key={i}
          className={cx(
            'rounded-[4px] font-700 text-blue-d25 border-[1px] border-blue-w75 bg-blue-w85 px-[4px]',
            className
          )}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

export default function PageCurriculumVitae() {
  const { profile } = config.content;
  const { email } = useRevealableEmail(false);

  return (
    <table className="table-fixed border-collapse w-[210mm] min-h-[297mm] text-[14px] mx-auto text-black">
      <thead>
        <tr>
          <td className="p-[32px] pb-[16px]">
            <header className="relative">
              <div className="absolute -top-[32px] right-0 w-[136px] h-[136px] bg-blue flex items-center justify-center">
                <div
                  className="w-[100px] h-[88px] bg-white"
                  style={{
                    maskImage: `url(${logo})`,
                    WebkitMaskImage: `url(${logo})`,
                    maskSize: 'contain',
                    WebkitMaskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskPosition: 'center',
                  }}
                />
              </div>

              <Block className="mt-0">
                <div className="text-md leading-none font-700 uppercase tracking-[5px]">{profile.name}</div>
                <div className="font-700">{profile.title}</div>
              </Block>

              <Block className="-mt-[8px] mb-0">
                <div className="w-[155mm] flex">
                  <Meta icon={faLocationDot} className="w-[45mm]">
                    {profile.location} ({profile.timezone})
                  </Meta>
                  <Meta icon={faBriefcase} className="w-[55mm]">
                    {profile.availability}
                  </Meta>
                  <Meta icon={faEnvelope}>
                    {email ?
                      <a href={`mailto:${email}`} className="text-blue-d25 underline">
                        {email}
                      </a>
                    : <span className="text-blue-d25">…</span>}
                  </Meta>
                </div>

                <div className="w-[155mm] flex">
                  <Meta icon={faGlobe} className="w-[45mm]">
                    <a href={profile.website} className="text-blue-d25 underline">
                      {shortUrl(profile.website)}
                    </a>
                  </Meta>
                  <Meta icon={faLinkedin} className="w-[55mm]">
                    <a href={profile.linkedin} className="text-blue-d25 underline">
                      {shortUrl(profile.linkedin)}
                    </a>
                  </Meta>
                  {config.features.upwork && (
                    <Meta icon={faUpwork}>
                      <a href="/upwork" className="text-blue-d25 underline">
                        {shortUrl(profile.website)}/upwork
                      </a>
                    </Meta>
                  )}
                </div>
              </Block>
            </header>
          </td>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td className="p-[32px] pt-0">
            <div className="flex gap-[24px]">
              <main className="flex-[65]">
                <Block className="mt-0">
                  <Block compact>
                    <Headline label="Summary" />
                  </Block>

                  <div className="text-[13px] [&>p]:m-0 [&>p]:mb-[8px] [&>p:last-child]:mb-0">
                    <VText text={profile.summary} params={{ yearsOfExperience: config.yearsOfExperience }} />
                  </div>
                </Block>

                {config.workGroups.map((work, i) => (
                  <Block className={cx(0 < i && 'break-before-page mt-0')}>
                    <Block compact>
                      <Headline label="Experience" />
                    </Block>

                    {work.map((job, j) => (
                      <Block key={i} className={cx(0 === j && 'mt-0')}>
                        <Block compact>
                          <Subline label={job.position[1]} meta={<Range start={job.startYear} end={job.endYear} />} />
                          <Venue label={job.company[1]} />
                        </Block>

                        <div className="text-[13px] [&>p]:m-0 [&>p]:mb-[8px] [&>p:last-child]:mb-0">
                          <VText text={job.description} />
                        </div>
                      </Block>
                    ))}
                  </Block>
                ))}
              </main>

              <aside className="flex-[35]">
                <Block className="mt-0">
                  <Block compact>
                    <Headline label="Skills" />
                  </Block>

                  {config.skillGroups.map((group, i) => (
                    <Block compact key={i} className={cx(0 === i && 'mt-0')}>
                      <Subline label={group.label} />
                      <Pills labels={group.skills} />
                    </Block>
                  ))}
                </Block>

                <Block>
                  <Block compact>
                    <Headline label="Education" />
                  </Block>

                  {config.education.map((school, i) => (
                    <Block key={i} className={cx(0 === i && 'mt-0')}>
                      <Block compact>
                        <Subline
                          label={school.position[0]}
                          meta={<Range start={school.startYear} end={school.endYear} />}
                        />
                        <Venue label={school.company[1]} />
                      </Block>
                      <div className="text-[13px] [&>p]:m-0 [&>p]:mb-[8px] [&>p:last-child]:mb-0">
                        <VText text={school.description} />
                      </div>
                    </Block>
                  ))}
                </Block>
              </aside>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
