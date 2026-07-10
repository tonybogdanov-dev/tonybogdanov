import { FormEvent, useState } from 'react';
import { faLocationDot, faPaperPlane, faAt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedinIn, faUpwork } from '@fortawesome/free-brands-svg-icons';

import { config } from '../../config.browser';
import VContainer from '../components/VContainer';
import VHeadline from '../components/VHeadline';
import VButton from '../components/VButton';
import VContact from '../components/VContact';
import VIcon from '../components/VIcon';
import VInput from '../components/VInput';
import VMax from '../components/VMax';
import cx from 'classnames';
import useRevealableEmail from '../hooks/useRevealableEmail';
import useTurnstile from '../hooks/useTurnstile';
import VAlert from '../components/VAlert';

export default function SectionContact() {
  const { profile } = config.content;
  const { email, ref: emailRef } = useRevealableEmail<HTMLDivElement>();
  const socialCount = 2 + (config.features.github ? 1 : 0) + (config.features.upwork ? 1 : 0); // e-mail + LinkedIn always shown
  const { containerRef: turnstileRef, token: turnstileToken, reset: resetTurnstile } = useTurnstile(
    config.turnstile.siteKey
  );

  const [isValid, setIsValid] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const captchaReady = turnstileToken !== null;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus('pending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), turnstileToken }),
      });
      setStatus(response.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    } finally {
      resetTurnstile();
    }
  };

  const onChange = (event: FormEvent<HTMLFormElement>) => {
    setIsValid(event.currentTarget.checkValidity());
  };

  return (
    <div id="contact" className="relative bg-white z-10">
      <div className="absolute left-0 right-0 bottom-0 w-full pt-sm bg-gradient-to-b from-[#eee] to-[#f8f8f8]">
        <div className="h-[1.75rem] lg:hidden" />
      </div>

      <VContainer max="lg" className="relative pt-xl">
        <div className="flex flex-col w-full lg:flex-row lg:gap-md">
          <div className="w-full lg:w-[45%] self-start order-1 pb-md lg:order-2 lg:pt-0">
            <VMax max="sm" className="mx-auto">
              <VHeadline headline="Let's talk" subline="Get In Touch" />

              <div className="flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-col gap-xs-fixed mt-sm">
                <VContact
                  icon={faAt}
                  label="E-mail"
                  value={email ?? '…'}
                  url={email ? `mailto:${email}` : undefined}
                  innerRef={emailRef}
                />
                {config.features.github && (
                  <VContact icon={faGithub} label="GitHub" value={profile.github} url={profile.github} />
                )}
                <VContact icon={faLinkedinIn} label="LinkedIn" value={profile.linkedin} url={profile.linkedin} />
                {config.features.upwork && (
                  <VContact
                    icon={faUpwork}
                    label="Upwork"
                    value={`${profile.website}/upwork`}
                    url="/upwork"
                  />
                )}
                {socialCount < 4 && <VContact icon={faLocationDot} label="Location" value={profile.location} />}
              </div>
            </VMax>
          </div>
          <div className="w-full lg:w-[55%] self-start order-2 lg:order-1">
            <VMax max="sm" className="mx-auto">
              <div className="bg-white p-sm rounded-3 shadow-2">
                <form className="flex flex-col gap-sm-fixed" onSubmit={onSubmit} onChange={onChange}>
                  <div className="flex flex-col sm:grid sm:grid-cols-2 gap-sm-fixed">
                    <VInput
                      id="contact-email"
                      name="email"
                      type="email"
                      label="Email"
                      required
                      placeholder="you@example.com"
                      disabled={status === 'success' || status === 'pending' || !captchaReady}
                    />

                    <VInput
                      id="contact-subject"
                      name="subject"
                      type="text"
                      label="Subject"
                      required
                      placeholder="What's this about?"
                      disabled={status === 'success' || status === 'pending' || !captchaReady}
                    />
                  </div>

                  <VInput
                    id="contact-message"
                    name="message"
                    disabled={status === 'success' || status === 'pending' || !captchaReady}
                    label="Message"
                    multiline
                    rows={5}
                    required
                    placeholder="Your message"
                  />

                  {(status === 'success' || status === 'error') && (
                    <VAlert
                      type={status}
                      text={
                        status === 'success' ?
                          "Message sent! I'll get back to you soon."
                        : 'Something went wrong. Please try again.'
                      }
                    />
                  )}

                  <div ref={turnstileRef} className="sr-only" />

                  {status !== 'success' && (
                    <div
                      className={cx(
                        'flex flex-col sm:flex-row items-center sm:justify-between gap-xs-fixed text-center',
                        'sm:text-left'
                      )}
                    >
                      <div className="text-[0.75rem] text-[#999]">
                        * Your email is used only to reply to you — never stored or shared.
                      </div>

                      <VButton
                        type="submit"
                        label="Send Message"
                        icon={
                          status === 'pending' || !captchaReady ?
                            <VIcon icon={faSpinner} className="animate-spin" />
                          : <VIcon icon={faPaperPlane} />
                        }
                        iconPosition="leading"
                        className="shrink-0"
                        disabled={!isValid || status === 'pending' || !captchaReady}
                      />
                    </div>
                  )}
                </form>
              </div>
            </VMax>
          </div>
        </div>
      </VContainer>
    </div>
  );
}
