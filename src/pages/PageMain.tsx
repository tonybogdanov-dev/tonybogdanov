import SectionHero from '../sections/SectionHero';
import SectionHighlight from '../sections/SectionHighlight';
import SectionAbout from '../sections/SectionAbout';
import SectionTimeline from '../sections/SectionTimeline';
import SectionSkills from '../sections/SectionSkills';
import SectionContact from '../sections/SectionContact';
import SectionFooter from '../sections/SectionFooter';
import React from 'react';

export default function PageMain() {
  return (
    <>
      <SectionHero />
      <SectionHighlight />
      <SectionAbout />
      <SectionTimeline />
      <SectionSkills />
      <SectionContact />
      <SectionFooter />
    </>
  );
}
