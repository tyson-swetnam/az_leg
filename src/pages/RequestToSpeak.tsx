import { useState } from 'react';
import {
  UPCOMING_AGENDAS_URL,
  AGENDA_SEARCH_URL,
  RTS_MANUAL_URL,
  LEGISCAN_AZ_STATE_URL,
} from '@/lib/constants';
import '@/styles/request-to-speak.css';

const ExternalLinkIcon = () => (
  <svg className="rts-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 17L17 7M17 7H7M17 7V17" />
  </svg>
);

const CTA_CARDS = [
  {
    title: 'Upcoming Agendas',
    description: 'View scheduled committee meetings and hearings for the current session.',
    url: UPCOMING_AGENDAS_URL,
  },
  {
    title: 'Agenda Search',
    description: 'Search past and future committee agendas by date, committee, or bill number.',
    url: AGENDA_SEARCH_URL,
  },
  {
    title: 'RTS Manual',
    description: 'Step-by-step instructions for using the Request to Speak system.',
    url: RTS_MANUAL_URL,
  },
  {
    title: 'Track Bills',
    description: 'Search and track Arizona legislation on LegiScan, including sponsors, history, and votes.',
    url: LEGISCAN_AZ_STATE_URL,
  },
];

const STEPS = [
  {
    title: 'Find a Committee Meeting',
    content: (
      <>
        Browse <a href={UPCOMING_AGENDAS_URL} target="_blank" rel="noopener noreferrer">upcoming agendas</a> to
        find a committee hearing on a bill you care about.
      </>
    ),
  },
  {
    title: 'Sign In to RTS',
    content: (
      <>
        Create a free account or sign in at the{' '}
        <a href="https://apps.azleg.gov/RequestToSpeak" target="_blank" rel="noopener noreferrer">
          Request to Speak portal
        </a>. You'll need your name, address, and email.
      </>
    ),
  },
  {
    title: 'Submit Your Request',
    content: (
      <>
        Select the bill and committee, choose your position (for, against, or neutral), and indicate whether
        you'd like to speak in person or submit a written statement.
      </>
    ),
  },
];

export function RequestToSpeak() {
  const [iframeError, setIframeError] = useState(false);

  return (
    <div className="rts-container">
      {/* Header */}
      <div className="rts-header">
        <div className="rts-header-content">
          <h1 className="rts-title">Request to Speak</h1>
          <p className="rts-subtitle">57th Arizona Legislature &bull; Citizen Participation</p>
        </div>
      </div>

      {/* Info Section */}
      <div className="rts-info">
        <div className="rts-info-box">
          <p>
            Arizona's Request to Speak (RTS) system allows citizens to register their position on bills
            before committee hearings. You can sign up to testify in person, submit a written position,
            or simply register your support or opposition.
          </p>
          <p>
            RTS is managed by the Arizona Legislature and is free to use. Requests must be submitted
            before the committee hearing begins.
          </p>
        </div>
      </div>

      {/* CTA Cards */}
      <div className="rts-cards-grid">
        {CTA_CARDS.map((card) => (
          <a
            key={card.title}
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rts-card"
          >
            <h2 className="rts-card-title">
              {card.title}
              <ExternalLinkIcon />
            </h2>
            <p className="rts-card-description">{card.description}</p>
          </a>
        ))}
      </div>

      {/* Embedded Agendas */}
      <div className="rts-iframe-section">
        <p className="rts-iframe-label">Live Upcoming Agendas</p>
        <div className="rts-iframe-container">
          {iframeError ? (
            <div className="rts-iframe-fallback">
              <p>
                The agenda viewer cannot be embedded here due to the Legislature's security settings.
              </p>
              <a
                href={UPCOMING_AGENDAS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rts-iframe-fallback-link"
              >
                View Upcoming Agendas
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </a>
            </div>
          ) : (
            <iframe
              src={UPCOMING_AGENDAS_URL}
              title="Upcoming Committee Agendas"
              onError={() => setIframeError(true)}
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </div>
      </div>

      {/* Step-by-Step Guide */}
      <div className="rts-steps-section">
        <h2 className="rts-steps-title">How to Participate</h2>
        <div className="rts-steps">
          {STEPS.map((step, index) => (
            <div key={step.title} className="rts-step">
              <div className="rts-step-number">{index + 1}</div>
              <div className="rts-step-content">
                <h3>{step.title}</h3>
                <p>{step.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
