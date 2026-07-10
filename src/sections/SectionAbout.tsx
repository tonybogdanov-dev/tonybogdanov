import { config } from '../../config.browser';
import VContainer from '../components/VContainer';
import VPrimaryStat from '../components/VPrimaryStat';
import VSecondaryStats from '../components/VSecondaryStats';
import VHeadline from '../components/VHeadline';
import VMax from '../components/VMax';
import VText from '../components/VText';

export default function SectionAbout() {
  const { about } = config.content;

  return (
    <>
      <div id="about" className="relative bg-[#f8f8f8]">
        <div className="relative py-xl">
          <VContainer max="lg">
            <div className="flex flex-col lg:flex-row w-full">
              <div className="w-full lg:w-[35%] order-2 lg:order-1 lg:pt-0">
                <VMax max="xs" className="mx-auto mt-sm lg:mr-0">
                  <VPrimaryStat
                    value={about.stats.primary.value}
                    params={{ yearsOfExperience: config.yearsOfExperience }}
                    label={about.stats.primary.label}
                    className="lg:rounded-r-none"
                  />

                  <div className="px-sm-fixed lg:pr-0">
                    <VSecondaryStats
                      className="rounded-t-none lg:rounded-br-none"
                      statClassName="lg:pr-sm-fixed"
                      stats={about.stats.secondary}
                    />
                  </div>
                </VMax>
              </div>
              <div className="w-full lg:w-[65%] order-1 lg:order-2">
                <div className="bg-white p-sm rounded-3 shadow-2">
                  <VHeadline headline={about.headline} subline={about.subline} />
                  <VText text={about.text} />
                </div>
              </div>
            </div>
          </VContainer>
        </div>
      </div>
    </>
  );
}
