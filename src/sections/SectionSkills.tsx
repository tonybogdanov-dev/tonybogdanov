import cx from 'classnames';

import { config, skills as skillEntries } from '../../config.browser';
import { BaseProp } from '../utils/base-props';
import geometry from '../assets/geometry.svg';
import VContainer from '../components/VContainer';
import VHeadline from '../components/VHeadline';
import VPattern from '../components/VPattern';
import VSkillGrid from '../components/VSkillGrid';

export default function SectionSkills({ className }: BaseProp) {
  const { skills } = config.content;

  return (
    <div id="skills" className={cx('relative bg-gradient-to-b from-blue-d80 to-blue-d60', className)}>
      <VPattern svg={geometry} color="blue-d70" />

      <div className="relative py-xl">
        <VContainer max="lg">
          <VHeadline headline={skills.headline} subline={skills.subline} color="#fff" />
          <VSkillGrid
            skills={skillEntries}
            colors={config.colorSequence}
            breakpoints={Object.keys(config.breakpoints)}
          />
        </VContainer>
      </div>
    </div>
  );
}
