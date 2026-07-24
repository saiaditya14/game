import React from 'react';
import lan1 from '../../../images/lanterns/lan1.svg';
import lan2 from '../../../images/lanterns/lan2.svg';
import lan3 from '../../../images/lanterns/lan3.svg';
import lan4 from '../../../images/lanterns/lan4.svg';
import lan5 from '../../../images/lanterns/lan5.svg';

// Cozy-only: paper lanterns hanging from the top of the page, each swaying at
// its own speed/offset so they never move in lockstep.
const LANTERNS = [
  { src: lan1, left: '8%', width: '3.4rem', duration: '6.5s', delay: '0s' },
  { src: lan2, left: '24%', width: '2.9rem', duration: '5.4s', delay: '0.8s' },
  { src: lan3, left: '50%', width: '3.8rem', duration: '7.2s', delay: '0.3s' },
  { src: lan4, left: '76%', width: '3rem', duration: '5.9s', delay: '1.2s' },
  { src: lan5, left: '92%', width: '2.6rem', duration: '6.8s', delay: '0.5s' },
];

const ConnectFourLanterns = () => (
  <div className="connect-four-lanterns" aria-hidden="true">
    {LANTERNS.map((lantern, index) => (
      <div
        key={index}
        className="connect-four-lantern"
        style={{ left: lantern.left, animationDuration: lantern.duration, animationDelay: lantern.delay }}
      >
        <div className="connect-four-lantern-cord" />
        <div className="connect-four-lantern-glow" />
        <img src={lantern.src} alt="" style={{ width: lantern.width, height: 'auto' }} />
      </div>
    ))}
  </div>
);

export default ConnectFourLanterns;
