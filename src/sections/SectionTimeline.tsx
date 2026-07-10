import { Fragment } from 'react';
import cx from 'classnames';

import { config } from '../../config.browser';
import { BaseProp } from '../utils/base-props';
import VContainer from '../components/VContainer';
import VHeadline from '../components/VHeadline';
import VJob, { VJobColor } from '../components/VJob';
import VJobLine from '../components/VJobLine';
import VText from '../components/VText';

const COLORS = config.colorSequence as VJobColor[];

export default function SectionTimeline({ className }: BaseProp) {
  const { timeline } = config.content;
  const { jobs } = timeline;

  return (
    <div id="timeline" className={cx('relative bg-white', className)}>
      <VContainer max="lg" className="py-xl">
        <VHeadline headline={timeline.headline} subline={timeline.subline} />

        <div className="sm:px-[2rem]">
          {jobs.map((job, index) => {
            const flip = index % 2 === 1;
            const color = COLORS[index % COLORS.length];
            const nextColor = COLORS[(index + 1) % COLORS.length];

            return (
              <Fragment key={index}>
                <VJob
                  flip={flip}
                  label={job.label}
                  color={color}
                  startYear={job.startYear}
                  endYear={job.endYear}
                  position={job.position}
                  company={job.company}
                  companyUrl={job.companyUrl}
                  summary={job.summary}
                  className="z-10"
                >
                  <VText text={job.description} />
                </VJob>

                {index < jobs.length - 1 && (
                  <VJobLine flip={flip} sourceColor={color} targetColor={nextColor} className="z-0" />
                )}
              </Fragment>
            );
          })}
        </div>
      </VContainer>
    </div>
  );
}
